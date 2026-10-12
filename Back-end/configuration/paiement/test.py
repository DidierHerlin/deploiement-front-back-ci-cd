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
from paiement.models import Paiement, quittance_upload_path
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
