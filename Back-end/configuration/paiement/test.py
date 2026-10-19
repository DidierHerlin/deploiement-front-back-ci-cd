"""
Tests complets pour l'application Paiement.
Couvre : modèles, génération automatique de l'échéancier, utilitaires (génération de quittance PDF),
vues API (list, retrieve, valider, refuser, annuler, quittance, impayés, filtres), et permissions.
"""
from datetime import date, timedelta
from decimal import Decimal

from dateutil.relativedelta import relativedelta
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bien.models import Bien
from contrats.models import Contrat
from notifications.models import Notification
from paiement.models import Paiement, DemandePaiement, quittance_upload_path, get_mois_a_venir
from paiement.utils import formater_montant_ar, generate_quittance_pdf
from utilisateur.models import Locataire, Proprietaire, Utilisateur


# ==============================================================================
# Helpers
# ==============================================================================

def _make_user(email, role):
    return Utilisateur.objects.create_user(email=email, password="testpass123!", role=role)


def _make_bien(proprietaire, titre="Bien Test", statut=Bien.StatutBien.DISPONIBLE):
    return Bien.objects.create(
        proprietaire=proprietaire, titre=titre,
        type=Bien.TypeBien.APPARTEMENT,
        mode_transaction=Bien.ModeTransaction.LOCATION,
        adresse="123 Rue Test, Antananarivo",
        surface=60, nombre_pieces=3, loyer_mensuel=500_000,
        statut=statut,
    )


def _make_contrat(bien, locataire, date_debut=None):
    if date_debut is None:
        date_debut = date.today() - relativedelta(months=2)
    return Contrat.objects.create(
        bien=bien, locataire=locataire,
        type_contrat=Contrat.TypeContrat.LOCATION,
        date_debut=date_debut,
        date_fin=date_debut + relativedelta(months=12),
        loyer=500_000, depot_garantie=500_000,
    )


def _make_paiement(contrat, delta_months=100, statut=Paiement.StatutPaiement.EN_ATTENTE):
    return Paiement.objects.create(
        contrat=contrat,
        date_echeance=date.today() + relativedelta(months=delta_months),
        montant=500_000, montant_attendu=500_000,
        statut=statut,
    )


# ==============================================================================
# 1. Tests API de Création et Validation des Paiements
# ==============================================================================

class PaiementAPITestCase(APITestCase):
    def setUp(self):
        self.admin = Utilisateur.objects.create_superuser(
            email="admin_api@test.com", password="pass", nom="Admin", prenoms="Test"
        )
        self.agent = Utilisateur.objects.create_user(
            email="agent_api@test.com", password="pass", role=Utilisateur.Role.AGENT,
            nom="Agent", prenoms="Test"
        )
        self.locataire_user = Utilisateur.objects.create_user(
            email="loc_api@test.com", password="pass", role=Utilisateur.Role.LOCATAIRE,
            nom="Dupont", prenoms="Jean"
        )
        self.locataire = Locataire.objects.create(user=self.locataire_user)
        self.proprietaire_user = Utilisateur.objects.create_user(
            email="proprio_api@test.com", password="pass", role=Utilisateur.Role.PROPRIETAIRE,
            nom="Rakoto", prenoms="Jean"
        )
        self.proprietaire = Proprietaire.objects.create(user=self.proprietaire_user, iban="FR123")

        self.bien = Bien.objects.create(
            proprietaire=self.proprietaire,
            titre="Appartement F3",
            type="APPARTEMENT",
            mode_transaction="LOCATION",
            adresse="Tana",
            surface=80,
            nombre_pieces=3,
            loyer_mensuel=500000,
            statut=Bien.StatutBien.DISPONIBLE
        )
        self.contrat = Contrat.objects.create(
            bien=self.bien,
            locataire=self.locataire,
            type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=timezone.now().date() - timezone.timedelta(days=30),
            date_fin=timezone.now().date() + timezone.timedelta(days=335),
            loyer=500000,
            depot_garantie=1000000,
            statut=Contrat.StatutContrat.ACTIF
        )
        self.client.force_authenticate(user=self.agent)
        Paiement.objects.all().delete()

    def test_creer_paiement_complet(self):
        url = reverse("paiement-list")
        data = {
            "contrat": self.contrat.id,
            "montant": 500000,
            "mode_paiement": "VIREMENT",
            "reference": "",
            "est_partiel": False
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["montant"], "500000.00")
        self.assertEqual(response.data["statut"], "EN_ATTENTE")

    def test_creer_paiement_montant_incoherent(self):
        url = reverse("paiement-list")
        data = {
            "contrat": self.contrat.id,
            "montant": 300000,
            "mode_paiement": "VIREMENT",
            "reference": "",
            "est_partiel": False
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("montant", response.data)

    def test_creer_paiement_mobile_sans_reference(self):
        url = reverse("paiement-list")
        data = {
            "contrat": self.contrat.id,
            "montant": 500000,
            "mode_paiement": "MVOLA",
            "reference": "",
            "est_partiel": False
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reference", response.data)

    def test_validation_paiement(self):
        paiement = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance="2026-10-05",
            montant=500000,
            mode_paiement="VIREMENT",
            statut=Paiement.StatutPaiement.EN_ATTENTE
        )
        url = reverse("paiement-valider", args=[paiement.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        paiement.refresh_from_db()
        self.assertEqual(paiement.statut, Paiement.StatutPaiement.PAYE)


# ==============================================================================
# 2. Tests de la Génération d'Échéancier
# ==============================================================================

class EcheancierGenerationTestCase(TestCase):
    def setUp(self):
        self.proprio_user = Utilisateur.objects.create_user(
            email="proprio_ech@test.com", password="TestPass123!", role=Utilisateur.Role.PROPRIETAIRE,
            nom="Dupont", prenoms="Jean",
        )
        self.proprietaire = Proprietaire.objects.create(user=self.proprio_user, iban="FR123")

        self.loc_user = Utilisateur.objects.create_user(
            email="loc_ech@test.com", password="TestPass123!", role=Utilisateur.Role.LOCATAIRE,
            nom="Martin", prenoms="Paul",
        )
        self.locataire = Locataire.objects.create(user=self.loc_user)

        self.bien_location = Bien.objects.create(
            proprietaire=self.proprietaire,
            titre="Appart Test",
            type="APPARTEMENT",
            mode_transaction="LOCATION",
            adresse="Tana",
            surface=50,
            nombre_pieces=3,
            loyer_mensuel=500_000,
            statut=Bien.StatutBien.DISPONIBLE,
        )

    def _creer_bien_location(self, titre="Bien Sup", **overrides):
        valeurs = {
            "proprietaire": self.proprietaire,
            "titre": titre,
            "type": "APPARTEMENT",
            "mode_transaction": "LOCATION",
            "adresse": "Tana",
            "surface": 40,
            "nombre_pieces": 2,
            "loyer_mensuel": 400_000,
            "statut": Bien.StatutBien.DISPONIBLE,
        }
        valeurs.update(overrides)
        return Bien.objects.create(**valeurs)

    def test_generation_echeancier_12_mois(self):
        contrat = Contrat.objects.create(
            bien=self.bien_location,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 1),
            date_fin=date(2027, 1, 1),
            loyer=500_000,
            depot_garantie=1_000_000,
            statut="ACTIF",
        )
        paiements = Paiement.objects.filter(contrat=contrat).order_by("date_echeance")
        self.assertEqual(paiements.count(), 12)
        self.assertEqual(paiements.first().date_echeance, date(2026, 1, 1))
        self.assertEqual(paiements.last().date_echeance, date(2026, 12, 1))

    def test_generation_echeancier_contrat_achat(self):
        prix = Decimal("50000000.00")
        bien_vente = Bien.objects.create(
            proprietaire=self.proprietaire,
            titre="Maison Achat Test",
            type="MAISON",
            mode_transaction="VENTE",
            adresse="Tana",
            surface=120,
            nombre_pieces=5,
            prix=prix,
            statut=Bien.StatutBien.DISPONIBLE,
        )
        contrat = Contrat.objects.create(
            bien=bien_vente,
            locataire=self.locataire,
            type_contrat="ACHAT",
            type_paiement_achat="PARTIEL",
            date_debut=date(2026, 1, 1),
            date_fin=None,
            loyer=None,
            depot_garantie=None,
            prix=prix,
            statut="ACTIF",
        )
        paiements = Paiement.objects.filter(contrat=contrat).order_by("num_echeance")
        self.assertEqual(paiements.count(), 6)

        montant_premier = (prix * Decimal("0.50")).quantize(Decimal("0.01"))
        montant_mensualite = (prix * Decimal("0.10")).quantize(Decimal("0.01"))
        self.assertEqual(paiements[0].montant_attendu, montant_premier)
        for i in range(1, 6):
            self.assertEqual(paiements[i].montant_attendu, montant_mensualite)
        for p in paiements:
            self.assertIsNone(p.mode_paiement)

    def test_idempotence_pas_de_doublons(self):
        contrat = Contrat.objects.create(
            bien=self.bien_location,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 1),
            date_fin=date(2027, 1, 1),
            loyer=500_000,
            depot_garantie=1_000_000,
            statut="ACTIF",
        )
        self.assertEqual(Paiement.objects.filter(contrat=contrat).count(), 12)
        contrat.save()
        self.assertEqual(Paiement.objects.filter(contrat=contrat).count(), 12)

    def test_montant_attendu_egal_loyer(self):
        bien = self._creer_bien_location(titre="Bien Loyer 750k", loyer_mensuel=750_000)
        contrat = Contrat.objects.create(
            bien=bien,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 3, 1),
            date_fin=date(2026, 9, 1),
            loyer=750_000,
            depot_garantie=1_500_000,
            statut="ACTIF",
        )
        loyer = Decimal("750000.00")
        depot = Decimal("1500000.00")
        paiements = Paiement.objects.filter(contrat=contrat).order_by("date_echeance")
        for i, p in enumerate(paiements):
            if i == 0:
                self.assertEqual(p.montant_attendu, loyer + depot)
            else:
                self.assertEqual(p.montant_attendu, loyer)

    def test_date_fin_de_mois_31_janvier(self):
        bien = self._creer_bien_location(titre="Bien Fin Mois")
        contrat = Contrat.objects.create(
            bien=bien,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 31),
            date_fin=date(2026, 4, 30),
            loyer=400_000,
            depot_garantie=800_000,
            statut="ACTIF",
        )
        paiements = Paiement.objects.filter(contrat=contrat).order_by("date_echeance")
        dates = list(paiements.values_list("date_echeance", flat=True))
        self.assertEqual(len(dates), 4)
        self.assertEqual(dates[0], date(2026, 1, 31))
        self.assertEqual(dates[1], date(2026, 2, 28))
        self.assertEqual(dates[2], date(2026, 3, 28))
        self.assertEqual(dates[3], date(2026, 4, 28))

    def test_annulation_echeances_sur_resiliation(self):
        contrat = Contrat.objects.create(
            bien=self.bien_location,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 1),
            date_fin=date(2027, 1, 1),
            loyer=500_000,
            depot_garantie=1_000_000,
            statut="ACTIF",
        )
        self.assertEqual(Paiement.objects.filter(contrat=contrat).count(), 12)
        contrat.resilier()
        nb_en_attente = Paiement.objects.filter(
            contrat=contrat, statut=Paiement.StatutPaiement.EN_ATTENTE
        ).count()
        self.assertEqual(nb_en_attente, 0)
        nb_annulees = Paiement.objects.filter(
            contrat=contrat, statut=Paiement.StatutPaiement.ANNULE
        ).count()
        self.assertEqual(nb_annulees, 12)

    def test_non_regeneration_contrat_termine(self):
        contrat = Contrat.objects.create(
            bien=self.bien_location,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 1),
            date_fin=date(2027, 1, 1),
            loyer=500_000,
            depot_garantie=1_000_000,
            statut="ACTIF",
        )
        self.assertEqual(Paiement.objects.filter(contrat=contrat).count(), 12)
        contrat.terminer()
        total_paiements = Paiement.objects.filter(contrat=contrat).count()
        self.assertEqual(total_paiements, 12)
        nb_annulees = Paiement.objects.filter(
            contrat=contrat, statut=Paiement.StatutPaiement.ANNULE
        ).count()
        self.assertEqual(nb_annulees, 12)


# ==============================================================================
# 3. Tests des Utilitaires Paiement (Quittance PDF, etc.)
# ==============================================================================

class PaiementUtilsTest(TestCase):
    def setUp(self):
        self.prop_user = Utilisateur.objects.create_user(email="prop_u@test.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.loc_user = Utilisateur.objects.create_user(email="loc_u@test.com", password="pwd", role=Utilisateur.Role.LOCATAIRE)
        self.proprietaire = Proprietaire.objects.create(user=self.prop_user)
        self.locataire = Locataire.objects.create(user=self.loc_user)

        self.bien = Bien.objects.create(
            titre="Appartement Test",
            proprietaire=self.proprietaire,
            type=Bien.TypeBien.TERRAIN,
            statut=Bien.StatutBien.DISPONIBLE,
            loyer_mensuel=Decimal("500000.00"),
            adresse="123 test",
            surface=50
        )
        self.contrat = Contrat.objects.create(
            bien=self.bien,
            locataire=self.locataire,
            type_contrat=Contrat.TypeContrat.LOCATION,
            loyer=Decimal("500000.00"),
            depot_garantie=Decimal("250000.00"),
            date_debut=timezone.now().date(),
            date_fin=timezone.now().date() + timezone.timedelta(days=365),
            statut="ACTIF"
        )
        paiements = list(Paiement.objects.filter(contrat=self.contrat).order_by('date_echeance'))
        if len(paiements) < 2:
            self.paiement_1 = Paiement.objects.create(
                contrat=self.contrat, montant=Decimal("500000.00"), montant_paye=Decimal("500000.00"),
                statut=Paiement.StatutPaiement.PAYE, date_echeance=timezone.now().date() + timezone.timedelta(days=1)
            )
            self.paiement_2 = Paiement.objects.create(
                contrat=self.contrat, montant=Decimal("500000.00"), montant_paye=Decimal("500000.00"),
                statut=Paiement.StatutPaiement.PAYE, date_echeance=timezone.now().date() + timezone.timedelta(days=32)
            )
        else:
            self.paiement_1 = paiements[0]
            self.paiement_1.montant_paye = Decimal("500000.00")
            self.paiement_1.statut = Paiement.StatutPaiement.PAYE
            self.paiement_1.save()
            self.paiement_2 = paiements[1]
            self.paiement_2.montant_paye = Decimal("500000.00")
            self.paiement_2.statut = Paiement.StatutPaiement.PAYE
            self.paiement_2.save()

    def test_formater_montant_ar(self):
        self.assertEqual(formater_montant_ar(None), "0")
        self.assertEqual(formater_montant_ar(500000), "500 000")

    def test_generate_quittance_premier_paiement(self):
        generate_quittance_pdf(self.paiement_1)
        self.assertTrue(self.paiement_1.fichier_quittance.name.endswith(".pdf"))

    def test_generate_quittance_deuxieme_paiement(self):
        generate_quittance_pdf(self.paiement_2)
        self.assertTrue(self.paiement_2.fichier_quittance.name.endswith(".pdf"))


# ==============================================================================
# 4. Tests des Modèles Paiement
# ==============================================================================

class PaiementModelUnitTests(TestCase):
    def setUp(self):
        self.u1 = Utilisateur.objects.create_user(email="p_mu@t.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.u1, iban="MG123")
        self.u2 = Utilisateur.objects.create_user(email="l_mu@t.com", password="pwd", nom="Doe", prenoms="John", role=Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.u2)

        self.bien_loc = Bien.objects.create(
            proprietaire=self.prop, titre="A", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=50,
            nombre_pieces=2, loyer_mensuel=1000, statut=Bien.StatutBien.DISPONIBLE
        )
        future_date = timezone.now().date() + relativedelta(months=1)
        future_end = timezone.now().date() + relativedelta(months=12)
        self.contrat = Contrat.objects.create(
            bien=self.bien_loc, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=future_date, date_fin=future_end, loyer=1000, depot_garantie=1000
        )
        Paiement.objects.all().delete()

    def test_creation_paiement_valide(self):
        future_date = timezone.now().date() + relativedelta(months=2)
        p = Paiement(
            contrat=self.contrat,
            date_echeance=future_date,
            montant=1000,
            montant_attendu=1000,
            montant_paye=0
        )
        p.save()
        self.assertEqual(p.statut, Paiement.StatutPaiement.EN_ATTENTE)
        self.assertEqual(p.locataire, self.loc)
        self.assertEqual(p.nom_locataire, "John Doe")
        self.assertEqual(p.montant_restant, 1000)
        self.assertTrue(isinstance(p.message_mois, str))
        self.assertTrue(isinstance(p.mois_echeance, str))
        self.assertEqual(str(p), f"Paiement #{p.pk} — A (En attente)")

    def test_mobile_money_reference_obligatoire(self):
        p = Paiement(
            contrat=self.contrat,
            date_echeance=date(2025, 2, 1),
            montant=1000,
            mode_paiement=Paiement.ModePaiement.MVOLA,
            reference=""
        )
        with self.assertRaises(ValidationError) as ctx:
            p.full_clean()
        self.assertIn("reference", ctx.exception.message_dict)

    def test_validation_et_annulation(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2025, 2, 1),
            montant=1000,
            montant_attendu=1000
        )
        p.valider_paiement()
        self.assertEqual(p.statut, Paiement.StatutPaiement.PAYE)
        self.assertIsNotNone(p.date_paiement)

        with self.assertRaises(ValueError):
            p.valider_paiement()
        with self.assertRaises(ValueError):
            p.annuler_paiement()

    def test_annuler_paiement(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2025, 2, 1),
            montant=1000,
            montant_attendu=1000
        )
        p.annuler_paiement()
        self.assertEqual(p.statut, Paiement.StatutPaiement.ANNULE)

    def test_est_en_retard(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2000, 1, 1),
            montant=1000
        )
        self.assertTrue(p.est_en_retard)

    def test_quittance_upload_path(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2025, 2, 1),
            montant=1000
        )
        path = quittance_upload_path(p, "test.pdf")
        self.assertEqual(path, f"quittances/contrat_{self.contrat.id}/paiement_{p.pk}.pdf")

    def test_mois_echeance_and_message(self):
        p = Paiement(
            contrat=self.contrat,
            date_echeance=date(2026, 2, 1),
            montant=1000.0
        )
        self.assertEqual(p.mois_echeance, "février 2026")
        self.assertEqual(p.message_mois, "Ce paiement correspond au mois de février 2026.")


# ==============================================================================
# 5. Tests des Vues API Paiement
# ==============================================================================

class PaiementTestBase(APITestCase):
    def setUp(self):
        self.agent_user = _make_user("agent@ptest.mg", Utilisateur.Role.AGENT)
        self.admin_user = _make_user("admin@ptest.mg", Utilisateur.Role.ADMIN)

        self.prop_user = _make_user("proprio@ptest.mg", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG12345")

        self.loc_user = _make_user("locataire@ptest.mg", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)

        self.other_loc_user = _make_user("other.loc@ptest.mg", Utilisateur.Role.LOCATAIRE)
        self.other_loc = Locataire.objects.create(user=self.other_loc_user)

        self.bien = _make_bien(self.prop, titre="Appartement Principal")
        self.contrat = _make_contrat(self.bien, self.loc)

        Paiement.objects.all().delete()
        self.paiement = _make_paiement(self.contrat, delta_months=1 + 100)


class PaiementListTests(PaiementTestBase):
    def test_list_as_agent_returns_all(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [p["id"] for p in response.data["results"]]
        self.assertIn(self.paiement.id, ids)

    def test_list_as_admin_returns_all(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_as_locataire_filtered_to_own(self):
        bien2 = _make_bien(self.prop, titre="Autre Bien")
        contrat2 = _make_contrat(bien2, self.other_loc)
        paiement_other = Paiement.objects.create(
            contrat=contrat2,
            date_echeance=date.today() + relativedelta(months=3 + 100),
            montant=500_000, montant_attendu=500_000,
        )
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [p["id"] for p in response.data["results"]]
        self.assertIn(self.paiement.id, ids)
        self.assertNotIn(paiement_other.id, ids)

    def test_list_as_proprietaire_filtered_to_own_biens(self):
        other_prop_user = _make_user("other.prop@ptest.mg", Utilisateur.Role.PROPRIETAIRE)
        other_prop = Proprietaire.objects.create(user=other_prop_user, iban="MG99999")
        other_bien = _make_bien(other_prop, titre="Bien Autre Proprio")
        contrat_other = _make_contrat(other_bien, self.other_loc)
        paiement_other = Paiement.objects.create(
            contrat=contrat_other,
            date_echeance=date.today() + relativedelta(months=4 + 100),
            montant=500_000, montant_attendu=500_000,
        )
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [p["id"] for p in response.data["results"]]
        self.assertIn(self.paiement.id, ids)
        self.assertNotIn(paiement_other.id, ids)

    def test_list_unauthenticated_returns_401(self):
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PaiementRetrieveTests(PaiementTestBase):
    def test_retrieve_as_agent(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_as_own_locataire(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_not_found(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/paiements/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PaiementValiderTests(PaiementTestBase):
    def test_valider_as_agent(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(
            f"/api/paiements/{self.paiement.id}/valider/",
            {"mode_paiement": "VIREMENT", "reference": "REF123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paiement.refresh_from_db()
        self.assertEqual(self.paiement.statut, Paiement.StatutPaiement.PAYE)

    def test_valider_as_locataire_forbidden(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.post(
            f"/api/paiements/{self.paiement.id}/valider/",
            {"mode_paiement": "VIREMENT"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PaiementRefuserTests(PaiementTestBase):
    def test_refuser_as_agent(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(f"/api/paiements/{self.paiement.id}/refuser/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paiement.refresh_from_db()
        self.assertEqual(self.paiement.statut, Paiement.StatutPaiement.ANNULE)


class PaiementAnnulerTests(PaiementTestBase):
    def test_annuler_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f"/api/paiements/{self.paiement.id}/annuler/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paiement.refresh_from_db()
        self.assertEqual(self.paiement.statut, Paiement.StatutPaiement.ANNULE)


class PaiementQuittanceTests(PaiementTestBase):
    def test_quittance_non_paye_returns_400(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/quittance/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_quittance_not_found(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/paiements/999/quittance/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_quittance_paye_generation_and_download(self):
        self.paiement.statut = Paiement.StatutPaiement.PAYE
        self.paiement.montant_paye = self.paiement.montant
        self.paiement.save()
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/quittance/", HTTP_ORIGIN="http://localhost:3000")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("inline;", response["Content-Disposition"])


class PaiementImpayesTests(PaiementTestBase):
    def test_impayes_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/paiements/impayes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PaiementFiltreTests(PaiementTestBase):
    def test_filter_by_statut(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get("/api/paiements/?statut=EN_ATTENTE")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_filter_by_contrat(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(f"/api/paiements/?contrat={self.contrat.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PaiementUtilsAndSerializerBoostTests(PaiementTestBase):
    def test_formater_montant_ar(self):
        from paiement.utils import formater_montant_ar
        self.assertEqual(formater_montant_ar(None), "0")
        self.assertEqual(formater_montant_ar("bad"), "bad")
        self.assertEqual(formater_montant_ar(250000), "250 000")

    def test_generate_quittance_pdf_non_paye(self):
        from paiement.utils import generate_quittance_pdf
        self.paiement.statut = Paiement.StatutPaiement.EN_ATTENTE
        self.paiement.save()
        filename = generate_quittance_pdf(self.paiement)
        self.assertTrue(bool(filename))

    def test_generate_quittance_pdf_errors(self):
        from paiement.utils import generate_quittance_pdf
        from unittest.mock import patch
        with patch('paiement.utils.render_to_string', side_effect=Exception("Template error")):
            with self.assertRaises(Exception):
                generate_quittance_pdf(self.paiement)

        with patch('paiement.utils.pisa.pisaDocument') as mock_pisa:
            mock_pisa.return_value = type('Status', (), {'err': 1})()
            with self.assertRaises(Exception):
                generate_quittance_pdf(self.paiement)


# ==============================================================================
# Tests pour la Demande de Paiement Mobile Money du Locataire
# ==============================================================================

class DemandePaiementTests(PaiementTestBase):
    def setUp(self):
        super().setUp()
        today = date.today()
        # Calcul du mois à venir
        annee_cible, mois_cible = get_mois_a_venir(today)
        self.date_mois_a_venir = date(annee_cible, mois_cible, 5)

        # Facture autorisée (mois à venir)
        self.facture_autorisee = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=self.date_mois_a_venir,
            montant=500_000,
            montant_attendu=500_000,
            statut=Paiement.StatutPaiement.EN_ATTENTE,
        )

        # Facture d'un mois passé (déjà payée pour que facture_autorisee soit la plus ancienne impayée)
        date_mois_passe = date(today.year, today.month, 1) - relativedelta(months=1)
        self.facture_passee = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date_mois_passe,
            montant=500_000,
            montant_attendu=500_000,
            statut=Paiement.StatutPaiement.PAYE,
        )

        # Facture d'un mois futur autre que le mois autorisé (M+3)
        date_futur_lointain = self.date_mois_a_venir + relativedelta(months=3)
        self.facture_futur_lointain = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date_futur_lointain,
            montant=500_000,
            montant_attendu=500_000,
            statut=Paiement.StatutPaiement.EN_ATTENTE,
        )

        # Facture appartenant à un autre locataire
        self.bien_other = _make_bien(self.prop, titre="Bien Autre Locataire")
        self.contrat_other = _make_contrat(self.bien_other, self.other_loc)
        self.facture_other = Paiement.objects.create(
            contrat=self.contrat_other,
            date_echeance=self.date_mois_a_venir,
            montant=500_000,
            montant_attendu=500_000,
            statut=Paiement.StatutPaiement.EN_ATTENTE,
        )

    def test_locataire_peut_soumettre_demande_facture_la_plus_ancienne(self):
        """Un locataire peut soumettre une demande pour sa facture impayée la plus ancienne."""
        self.client.force_authenticate(user=self.loc_user)
        url = "/api/demandes-paiement/"
        payload = {
            "facture": self.facture_autorisee.id,
            "moyen_paiement": "MVOLA",
            "telephone": "0341234567",
            "reference": "MV-2026-9999",
            "montant": 500_000,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["statut"], "EN_ATTENTE")
        self.assertEqual(response.data["moyen_paiement"], "MVOLA")
        self.assertEqual(Decimal(str(response.data["montant"])), Decimal("500000.00"))

        # Vérifier en base
        demande = DemandePaiement.objects.get(id=response.data["id"])
        self.assertEqual(demande.locataire, self.loc)
        self.assertEqual(demande.facture, self.facture_autorisee)

        # Vérifier que la facture n'est PAS marquée comme payée
        self.facture_autorisee.refresh_from_db()
        self.assertEqual(self.facture_autorisee.statut, Paiement.StatutPaiement.EN_ATTENTE)

    def test_locataire_ne_peut_pas_demander_facture_recente_si_ancienne_impayee(self):
        """Un locataire ne peut pas payer une facture récente si une facture antérieure est impayée."""
        # On rend la facture passée impayée
        self.facture_passee.statut = Paiement.StatutPaiement.EN_ATTENTE
        self.facture_passee.save()

        self.client.force_authenticate(user=self.loc_user)
        url = "/api/demandes-paiement/"
        # Tentative de paiement de facture_autorisee alors que facture_passee est impayée
        payload = {
            "facture": self.facture_autorisee.id,
            "moyen_paiement": "ORANGE_MONEY",
            "telephone": "0321234567",
            "reference": "OM-12345",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("facture", response.data)
        self.assertIn("plus ancienne", str(response.data["facture"]))

    def test_locataire_peut_payer_facture_suivante_quand_ancienne_est_payee(self):
        """Une fois l'ancienne facture payée, la facture suivante devient payable."""
        # facture_futur_lointain ne peut pas être payée car facture_autorisee est impayée
        self.assertTrue(self.facture_futur_lointain.a_echeance_anterieure_impayee)

        # Dès qu'on marque facture_autorisee comme PAYE
        self.facture_autorisee.statut = Paiement.StatutPaiement.PAYE
        self.facture_autorisee.save()

        # facture_futur_lointain devient éligible
        self.assertFalse(self.facture_futur_lointain.a_echeance_anterieure_impayee)
        self.assertTrue(self.facture_futur_lointain.est_eligible_demande)

        self.client.force_authenticate(user=self.loc_user)
        url = "/api/demandes-paiement/"
        payload = {
            "facture": self.facture_futur_lointain.id,
            "moyen_paiement": "AIRTEL_MONEY",
            "telephone": "0331234567",
            "reference": "AM-12345",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["statut"], "EN_ATTENTE")

    def test_locataire_ne_peut_pas_demander_facture_autre_locataire(self):
        """Un locataire ne peut pas demander le paiement de la facture d'un autre locataire."""
        self.client.force_authenticate(user=self.loc_user)
        url = "/api/demandes-paiement/"
        payload = {
            "facture": self.facture_other.id,
            "moyen_paiement": "MVOLA",
            "telephone": "0341234567",
            "reference": "MV-0000",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("facture", response.data)
        self.assertIn("propres factures", str(response.data["facture"]))

    def test_facture_deja_payee_ne_peut_pas_faire_objet_nouvelle_demande(self):
        """Une facture déjà payée ne peut pas faire l'objet d'une nouvelle demande."""
        self.facture_autorisee.statut = Paiement.StatutPaiement.PAYE
        self.facture_autorisee.montant_paye = 500_000
        self.facture_autorisee.save()

        self.client.force_authenticate(user=self.loc_user)
        url = "/api/demandes-paiement/"
        payload = {
            "facture": self.facture_autorisee.id,
            "moyen_paiement": "MVOLA",
            "telephone": "0341234567",
            "reference": "MV-0000",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("facture", response.data)
        self.assertIn("déjà payée", str(response.data["facture"]))

    def test_seconde_demande_identique_refusee_si_demande_en_cours(self):
        """Une seconde demande identique ne peut pas être créée lorsqu'une demande est déjà en cours."""
        DemandePaiement.objects.create(
            locataire=self.loc,
            facture=self.facture_autorisee,
            montant=500_000,
            moyen_paiement="MVOLA",
            telephone="0341234567",
            reference="REF-PREMIERE",
            statut=DemandePaiement.StatutDemande.EN_ATTENTE,
        )

        self.client.force_authenticate(user=self.loc_user)
        url = "/api/demandes-paiement/"
        payload = {
            "facture": self.facture_autorisee.id,
            "moyen_paiement": "ORANGE_MONEY",
            "telephone": "0321234567",
            "reference": "REF-DEUXIEME",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("facture", response.data)
        self.assertIn("déjà en cours", str(response.data["facture"]))

    def test_moyen_paiement_exclusivement_mobile_money(self):
        """Le moyen de paiement proposé et accepté pour cette fonctionnalité est exclusivement Mobile Money."""
        self.client.force_authenticate(user=self.loc_user)
        url = "/api/demandes-paiement/"

        # Moyens interdits
        for moyen_interdit in ["VIREMENT", "ESPECE", "CHEQUE", "AUTRE", "CARTE"]:
            payload = {
                "facture": self.facture_autorisee.id,
                "moyen_paiement": moyen_interdit,
                "telephone": "0341234567",
            }
            response = self.client.post(url, payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("moyen_paiement", response.data)

        # Moyens autorisés
        for moyen_autorise in ["MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY"]:
            # On supprime les éventuelles demandes pour éviter doublon
            DemandePaiement.objects.filter(facture=self.facture_autorisee).delete()
            payload = {
                "facture": self.facture_autorisee.id,
                "moyen_paiement": moyen_autorise,
                "telephone": "0341234567",
                "reference": f"REF-{moyen_autorise}",
            }
            response = self.client.post(url, payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data["moyen_paiement"], moyen_autorise)

    def test_montant_envoye_correspond_au_montant_reel(self):
        """Le montant envoyé au backend doit correspondre au montant réel de la facture."""
        self.client.force_authenticate(user=self.loc_user)
        url = "/api/demandes-paiement/"

        # Montant erroné
        payload_faux = {
            "facture": self.facture_autorisee.id,
            "moyen_paiement": "MVOLA",
            "telephone": "0341234567",
            "montant": 999_999,
        }
        response = self.client.post(url, payload_faux, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("montant", response.data)

        # Montant omis (auto-rempli par la facture)
        payload_sans_montant = {
            "facture": self.facture_autorisee.id,
            "moyen_paiement": "MVOLA",
            "telephone": "0341234567",
        }
        response = self.client.post(url, payload_sans_montant, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data["montant"])), Decimal("500000.00"))

    def test_demande_ne_marque_pas_automatiquement_facture_payee(self):
        """Une demande créée ne marque pas automatiquement la facture comme payée."""
        self.client.force_authenticate(user=self.loc_user)
        url = "/api/demandes-paiement/"
        payload = {
            "facture": self.facture_autorisee.id,
            "moyen_paiement": "MVOLA",
            "telephone": "0341234567",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.facture_autorisee.refresh_from_db()
        self.assertEqual(self.facture_autorisee.statut, Paiement.StatutPaiement.EN_ATTENTE)
        self.assertIsNone(self.facture_autorisee.date_paiement)

    def test_utilisateurs_non_autorises_ne_peuvent_pas_acceder(self):
        """Les utilisateurs non autorisés ne peuvent pas accéder à cette fonctionnalité."""
        url = "/api/demandes-paiement/"

        # 1. Non authentifié
        self.client.force_authenticate(user=None)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response = self.client.post(url, {"facture": self.facture_autorisee.id})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Propriétaire ne peut pas créer de demande
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.post(url, {
            "facture": self.facture_autorisee.id,
            "moyen_paiement": "MVOLA",
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_locataire_peut_consulter_ses_demandes_et_leur_statut(self):
        """Un locataire peut consulter ses demandes et vérifier leur statut."""
        demande = DemandePaiement.objects.create(
            locataire=self.loc,
            facture=self.facture_autorisee,
            montant=500_000,
            moyen_paiement="MVOLA",
            telephone="0341234567",
            reference="REF-CONSULT",
            statut=DemandePaiement.StatutDemande.EN_ATTENTE,
        )

        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/demandes-paiement/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [d["id"] for d in response.data["results"]]
        self.assertIn(demande.id, ids)

        # Détail
        detail_res = self.client.get(f"/api/demandes-paiement/{demande.id}/")
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data["statut"], "EN_ATTENTE")
        self.assertEqual(detail_res.data["moyen_paiement"], "MVOLA")

        # Un autre locataire ne voit pas cette demande
        self.client.force_authenticate(user=self.other_loc_user)
        other_res = self.client.get("/api/demandes-paiement/")
        other_ids = [d["id"] for d in other_res.data["results"]]
        self.assertNotIn(demande.id, other_ids)

    def test_locataire_peut_annuler_sa_demande_en_attente(self):
        """Un locataire peut annuler sa propre demande en attente."""
        demande = DemandePaiement.objects.create(
            locataire=self.loc,
            facture=self.facture_autorisee,
            montant=500_000,
            moyen_paiement="MVOLA",
            statut=DemandePaiement.StatutDemande.EN_ATTENTE,
        )
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.post(f"/api/demandes-paiement/{demande.id}/annuler/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        demande.refresh_from_db()
        self.assertEqual(demande.statut, DemandePaiement.StatutDemande.ANNULE)

    def test_agent_peut_valider_demande(self):
        """Un agent peut valider une demande, ce qui valide la facture correspondante."""
        demande = DemandePaiement.objects.create(
            locataire=self.loc,
            facture=self.facture_autorisee,
            montant=500_000,
            moyen_paiement="ORANGE_MONEY",
            telephone="0320000000",
            reference="OM-CONFIRMED",
            statut=DemandePaiement.StatutDemande.EN_ATTENTE,
        )
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(f"/api/demandes-paiement/{demande.id}/valider/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        demande.refresh_from_db()
        self.assertEqual(demande.statut, DemandePaiement.StatutDemande.VALIDE)

        # La facture associée est maintenant PAYEE
        self.facture_autorisee.refresh_from_db()
        self.assertEqual(self.facture_autorisee.statut, Paiement.StatutPaiement.PAYE)
        self.assertEqual(self.facture_autorisee.mode_paiement, "ORANGE_MONEY")
        self.assertEqual(self.facture_autorisee.reference, "OM-CONFIRMED")
        self.assertIsNotNone(self.facture_autorisee.date_paiement)

    def test_agent_peut_refuser_demande(self):
        """Un agent peut refuser une demande en précisant un motif."""
        demande = DemandePaiement.objects.create(
            locataire=self.loc,
            facture=self.facture_autorisee,
            montant=500_000,
            moyen_paiement="MVOLA",
            telephone="0340000000",
            statut=DemandePaiement.StatutDemande.EN_ATTENTE,
        )
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(
            f"/api/demandes-paiement/{demande.id}/refuser/",
            {"motif_refus": "Transaction introuvable"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        demande.refresh_from_db()
        self.assertEqual(demande.statut, DemandePaiement.StatutDemande.REFUSE)
        self.assertEqual(demande.motif_refus, "Transaction introuvable")

        # La facture reste en attente
        self.facture_autorisee.refresh_from_db()
        self.assertEqual(self.facture_autorisee.statut, Paiement.StatutPaiement.EN_ATTENTE)

    def test_factures_eligibles_action(self):
        """L'action factures-eligibles liste l'échéance impayée la plus ancienne du contrat."""
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/demandes-paiement/factures-eligibles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [f["id"] for f in response.data["results"]]
        # L'échéance la plus ancienne impayée (facture_autorisee car facture_passee est PAYE)
        self.assertIn(self.facture_autorisee.id, ids)
        self.assertNotIn(self.facture_futur_lointain.id, ids)
        self.assertNotIn(self.facture_other.id, ids)

        # Dès qu'elle est payée, l'échéance suivante devient éligible
        self.facture_autorisee.statut = Paiement.StatutPaiement.PAYE
        self.facture_autorisee.save()

        response2 = self.client.get("/api/demandes-paiement/factures-eligibles/")
        ids2 = [f["id"] for f in response2.data["results"]]
        self.assertIn(self.facture_futur_lointain.id, ids2)

    def test_proprietes_eligibilite_modele(self):
        """Vérifie les propriétés d'éligibilité chronologique sur Paiement."""
        self.assertTrue(self.facture_autorisee.est_eligible_demande)
        self.assertFalse(self.facture_autorisee.a_echeance_anterieure_impayee)

        # La facture future n'est pas éligible tant que la précédente est impayée
        self.assertTrue(self.facture_futur_lointain.a_echeance_anterieure_impayee)
        self.assertFalse(self.facture_futur_lointain.est_eligible_demande)

        # Une fois la précédente payée, la suivante devient éligible
        self.facture_autorisee.statut = Paiement.StatutPaiement.PAYE
        self.facture_autorisee.save()
        self.assertFalse(self.facture_futur_lointain.a_echeance_anterieure_impayee)
        self.assertTrue(self.facture_futur_lointain.est_eligible_demande)

        # Dès qu'une demande est créée, elle n'est plus éligible (demande en cours)
        DemandePaiement.objects.create(
            locataire=self.loc,
            facture=self.facture_futur_lointain,
            montant=500_000,
            moyen_paiement="MVOLA",
            statut=DemandePaiement.StatutDemande.EN_ATTENTE,
        )
        self.assertTrue(self.facture_futur_lointain.a_demande_en_cours)
        self.assertFalse(self.facture_futur_lointain.est_eligible_demande)

    def test_synchronisation_validation_directe_paiement(self):
        """Lorsque l'agent valide le paiement via PaiementViewSet, la demande passe en VALIDE."""
        demande = DemandePaiement.objects.create(
            locataire=self.loc,
            facture=self.facture_autorisee,
            montant=500_000,
            moyen_paiement="MVOLA",
            statut=DemandePaiement.StatutDemande.EN_ATTENTE,
        )
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(
            f"/api/paiements/{self.facture_autorisee.id}/valider/",
            {"mode_paiement": "MVOLA", "reference": "MVOLA-DIRECT"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        demande.refresh_from_db()
        self.assertEqual(demande.statut, DemandePaiement.StatutDemande.VALIDE)

    def test_enregistrement_moyen_paiement_choisi_par_locataire(self):
        """Vérifie que le moyen choisi par le locataire est fidèlement enregistré et associé à sa demande."""
        self.client.force_authenticate(user=self.loc_user)
        moyens_disponibles = ["MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY"]

        for moyen in moyens_disponibles:
            # Nettoyage préalable pour autoriser une nouvelle demande
            DemandePaiement.objects.filter(facture=self.facture_autorisee).delete()
            self.facture_autorisee.statut = Paiement.StatutPaiement.EN_ATTENTE
            self.facture_autorisee.mode_paiement = None
            self.facture_autorisee.reference = None
            self.facture_autorisee.save()

            payload = {
                "facture": self.facture_autorisee.id,
                "moyen_paiement": moyen,
                "telephone": "0341234567",
                "reference": f"REF-TEST-{moyen}",
            }
            response = self.client.post("/api/demandes-paiement/", payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            demande_id = response.data["id"]

            # Vérification directe en base de données
            demande = DemandePaiement.objects.get(id=demande_id)
            self.assertEqual(demande.moyen_paiement, moyen)
            self.assertEqual(demande.locataire, self.loc)
            self.assertEqual(demande.facture, self.facture_autorisee)
            self.assertEqual(demande.telephone, "0341234567")
            self.assertEqual(demande.reference, f"REF-TEST-{moyen}")

            # Vérification synchronisation sur la facture
            self.facture_autorisee.refresh_from_db()
            self.assertEqual(self.facture_autorisee.mode_paiement, moyen)

    def test_moyen_paiement_affiche_lors_de_la_consultation_de_la_demande(self):
        """Vérifie que le moyen de paiement est correctement exposé lors de la consultation."""
        demande = DemandePaiement.objects.create(
            locataire=self.loc,
            facture=self.facture_autorisee,
            montant=500_000,
            moyen_paiement="ORANGE_MONEY",
            telephone="0329988776",
            reference="OM-CONSULT-99",
            statut=DemandePaiement.StatutDemande.EN_ATTENTE,
        )

        self.client.force_authenticate(user=self.loc_user)

        # 1. Consultation via la liste des demandes
        list_res = self.client.get("/api/demandes-paiement/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        demande_data = next((d for d in list_res.data["results"] if d["id"] == demande.id), None)
        self.assertIsNotNone(demande_data)
        self.assertEqual(demande_data["moyen_paiement"], "ORANGE_MONEY")

        # 2. Consultation via le détail de la demande
        detail_res = self.client.get(f"/api/demandes-paiement/{demande.id}/")
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data["moyen_paiement"], "ORANGE_MONEY")
        self.assertEqual(detail_res.data["telephone"], "0329988776")
        self.assertEqual(detail_res.data["reference"], "OM-CONSULT-99")

        # 3. Consultation via la liste des factures
        paiement_res = self.client.get("/api/paiements/")
        self.assertEqual(paiement_res.status_code, status.HTTP_200_OK)
        facture_data = next((p for p in paiement_res.data["results"] if p["id"] == self.facture_autorisee.id), None)
        self.assertIsNotNone(facture_data)
        self.assertIsNotNone(facture_data.get("demande_en_cours"))
        self.assertEqual(facture_data["demande_en_cours"]["moyen_paiement"], "ORANGE_MONEY")

    def test_moyen_paiement_invalide_ou_non_autorise_est_rejete_par_backend(self):
        """Vérifie qu'un moyen de paiement invalide ou non autorisé est formellement rejeté."""
        self.client.force_authenticate(user=self.loc_user)
        moyens_interdits = [
            "VIREMENT",
            "ESPECE",
            "CHEQUE",
            "AUTRE",
            "CARTE_BANCAIRE",
            "PAYPAL",
            "BITCOIN",
            "RANDOM_STRING",
            "",
        ]

        for moyen in moyens_interdits:
            payload = {
                "facture": self.facture_autorisee.id,
                "moyen_paiement": moyen,
                "telephone": "0341234567",
            }
            response = self.client.post("/api/demandes-paiement/", payload, format="json")
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Le moyen '{moyen}' aurait dû être rejeté avec un code HTTP 400."
            )
            self.assertIn("moyen_paiement", response.data)


# ==============================================================================
# Tests Obligatoires : Montant total encaissé sur l'espace locataire
# ==============================================================================

class MontantTotalEncaisseTestCase(APITestCase):
    """
    Validation rigoureuse des règles de calcul du montant total encaissé :
    - Test 1 : Deux factures payées (100 000 Ar et 150 000 Ar) -> total = 250 000 Ar.
    - Test 2 : Facture d'un autre utilisateur (200 000 Ar) exclue du total du premier locataire.
    - Test 3 : Facture de 80 000 Ar en attente non comptabilisée.
    - Test 4 : Facture de 120 000 Ar en retard ou partiellement payée non comptabilisée.
    - Test 5 : Utilisateur sans aucune facture payée -> total = 0 Ar.
    - Test 6 : Validation de l'actualisation dynamique du montant après validation d'une facture.
    """

    def setUp(self):
        # Propriétaire & Bien
        self.proprio_user = _make_user("proprio_stats@test.mg", Utilisateur.Role.PROPRIETAIRE)
        self.proprio = Proprietaire.objects.create(user=self.proprio_user, iban="MG001")
        self.bien1 = _make_bien(self.proprio, titre="Bien Locataire 1")
        self.bien2 = _make_bien(self.proprio, titre="Bien Locataire 2")
        self.bien3 = _make_bien(self.proprio, titre="Bien Locataire 3")

        # Locataire 1 (Utilisateur principal)
        self.user1 = _make_user("loc1_stats@test.mg", Utilisateur.Role.LOCATAIRE)
        self.locataire1 = Locataire.objects.create(user=self.user1)
        self.contrat1 = Contrat.objects.create(
            bien=self.bien1, locataire=self.locataire1,
            type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date(2026, 1, 1),
            date_fin=date(2026, 12, 31),
            loyer=100_000, depot_garantie=100_000,
        )

        # Locataire 2 (Autre utilisateur)
        self.user2 = _make_user("loc2_stats@test.mg", Utilisateur.Role.LOCATAIRE)
        self.locataire2 = Locataire.objects.create(user=self.user2)
        self.contrat2 = Contrat.objects.create(
            bien=self.bien2, locataire=self.locataire2,
            type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date(2026, 1, 1),
            date_fin=date(2026, 12, 31),
            loyer=200_000, depot_garantie=200_000,
        )

        # Locataire 3 (Sans facture payée)
        self.user3 = _make_user("loc3_stats@test.mg", Utilisateur.Role.LOCATAIRE)
        self.locataire3 = Locataire.objects.create(user=self.user3)
        self.contrat3 = Contrat.objects.create(
            bien=self.bien3, locataire=self.locataire3,
            type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date(2026, 1, 1),
            date_fin=date(2026, 12, 31),
            loyer=50_000, depot_garantie=50_000,
        )

    def test_1_deux_factures_payees_donnent_250000(self):
        """Test 1 : Un utilisateur possède deux factures payées de 100 000 Ar et 150 000 Ar. Total = 250 000 Ar."""
        Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 1, 5),
            montant=100_000, montant_attendu=100_000, montant_paye=100_000,
            statut=Paiement.StatutPaiement.PAYE,
        )
        Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 2, 5),
            montant=150_000, montant_attendu=150_000, montant_paye=150_000,
            statut=Paiement.StatutPaiement.PAYE,
        )

        self.client.force_authenticate(user=self.user1)
        res = self.client.get("/api/paiements/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["total_encaisse"], 250_000.0)

    def test_2_facture_autre_utilisateur_non_incluse(self):
        """Test 2 : Un autre utilisateur possède une facture payée de 200 000 Ar. Exclue du premier utilisateur."""
        # Factures utilisateur 1 : 100 000 + 150 000 = 250 000
        Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 1, 5),
            montant=100_000, montant_attendu=100_000, montant_paye=100_000,
            statut=Paiement.StatutPaiement.PAYE,
        )
        Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 2, 5),
            montant=150_000, montant_attendu=150_000, montant_paye=150_000,
            statut=Paiement.StatutPaiement.PAYE,
        )

        # Facture utilisateur 2 : 200 000 Ar
        Paiement.objects.create(
            contrat=self.contrat2,
            date_echeance=date(2026, 1, 5),
            montant=200_000, montant_attendu=200_000, montant_paye=200_000,
            statut=Paiement.StatutPaiement.PAYE,
        )

        # Vérification pour utilisateur 1 : doit être exactement 250 000 Ar (et non 450 000 Ar)
        self.client.force_authenticate(user=self.user1)
        res1 = self.client.get("/api/paiements/stats/")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["total_encaisse"], 250_000.0)

        # Vérification pour utilisateur 2 : doit être 200 000 Ar
        self.client.force_authenticate(user=self.user2)
        res2 = self.client.get("/api/paiements/stats/")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data["total_encaisse"], 200_000.0)

    def test_3_facture_en_attente_non_comptabilisee(self):
        """Test 3 : Une facture de 80 000 Ar est en attente de paiement. Elle ne doit pas être comptabilisée."""
        Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 1, 5),
            montant=100_000, montant_attendu=100_000, montant_paye=100_000,
            statut=Paiement.StatutPaiement.PAYE,
        )
        Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 2, 5),
            montant=80_000, montant_attendu=80_000,
            statut=Paiement.StatutPaiement.EN_ATTENTE,
        )

        self.client.force_authenticate(user=self.user1)
        res = self.client.get("/api/paiements/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["total_encaisse"], 100_000.0)

    def test_4_facture_en_retard_ou_partielle_non_comptabilisee(self):
        """Test 4 : Une facture de 120 000 Ar en retard ou partiellement payée ne doit pas être comptabilisée comme payée."""
        # Facture 1 payée complète : 100 000 Ar
        Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 1, 5),
            montant=100_000, montant_attendu=100_000, montant_paye=100_000,
            statut=Paiement.StatutPaiement.PAYE,
        )
        # Facture 2 en retard : 120 000 Ar -> non comptabilisée
        Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 2, 5),
            montant=120_000, montant_attendu=120_000,
            statut=Paiement.StatutPaiement.EN_RETARD,
        )
        # Facture 3 partielle : montant 120 000 Ar (payé 60 000 Ar) -> non comptabilisée
        Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 3, 5),
            montant=120_000, montant_attendu=120_000, montant_paye=60_000,
            statut=Paiement.StatutPaiement.PARTIEL, est_partiel=True,
        )

        self.client.force_authenticate(user=self.user1)
        res = self.client.get("/api/paiements/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Seule la première facture (100 000 Ar) doit être dans le montant total encaissé
        self.assertEqual(res.data["total_encaisse"], 100_000.0)

    def test_5_utilisateur_sans_facture_payee_retourne_zero(self):
        """Test 5 : Si l'utilisateur connecté n'a aucune facture payée, le montant total encaissé doit être de 0 Ar."""
        Paiement.objects.create(
            contrat=self.contrat3,
            date_echeance=date(2026, 1, 5),
            montant=50_000, montant_attendu=50_000,
            statut=Paiement.StatutPaiement.EN_ATTENTE,
        )

        self.client.force_authenticate(user=self.user3)
        res = self.client.get("/api/paiements/stats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["total_encaisse"], 0.0)

    def test_6_serialisation_locataire_user_id(self):
        """Vérifie que le sérialiseur expose bien locataire_user_id pour le filtrage frontend."""
        p = Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 1, 5),
            montant=100_000, montant_attendu=100_000,
            statut=Paiement.StatutPaiement.PAYE,
        )
        self.client.force_authenticate(user=self.user1)
        res = self.client.get(f"/api/paiements/{p.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["locataire_user_id"], self.user1.id)

    def test_7_actualisation_apres_validation_facture(self):
        """Vérifie que le montant total encaissé est actualisé après validation d'une facture."""
        p = Paiement.objects.create(
            contrat=self.contrat1,
            date_echeance=date(2026, 1, 5),
            montant=100_000, montant_attendu=100_000,
            statut=Paiement.StatutPaiement.EN_ATTENTE,
        )

        self.client.force_authenticate(user=self.user1)
        res_avant = self.client.get("/api/paiements/stats/")
        self.assertEqual(res_avant.data["total_encaisse"], 0.0)

        # Validation de la facture
        p.valider_paiement()

        res_apres = self.client.get("/api/paiements/stats/")
        self.assertEqual(res_apres.data["total_encaisse"], 100_000.0)




