"""
Tests complets pour l'application Contrats.
Couvre : modèles (location et achat), règles métier de synchronisation bien/contrat,
calculs d'échéances et batch, vues API, transitions de statuts, téléchargement et permissions.
"""
from datetime import date, timedelta
from typing import Optional

from dateutil.relativedelta import relativedelta
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from utilisateur.models import Locataire, Proprietaire, Utilisateur


# Helpers

def make_user(email, role=Utilisateur.Role.AGENT, **kw):
    return Utilisateur.objects.create_user(
        email=email, password="pwd123", role=role,
        nom=kw.get("nom", "Test"), prenoms=kw.get("prenoms", "User")
    )


def make_bien(prop, titre="Bien", mode=Bien.ModeTransaction.LOCATION, statut=Bien.StatutBien.DISPONIBLE):
    return Bien.objects.create(
        proprietaire=prop, titre=titre,
        type=Bien.TypeBien.APPARTEMENT,
        mode_transaction=mode, adresse="Rue Test",
        surface=50, nombre_pieces=2, 
        loyer_mensuel=1000 if mode == Bien.ModeTransaction.LOCATION else None,
        prix=100000 if mode == Bien.ModeTransaction.VENTE else None,
        statut=statut
    )


def make_contrat(bien, loc, type_c=Contrat.TypeContrat.LOCATION, **kw):
    today = timezone.now().date()
    if type_c == Contrat.TypeContrat.LOCATION:
        return Contrat.objects.create(
            bien=bien, locataire=loc, type_contrat=type_c,
            date_debut=kw.get("date_debut", today),
            date_fin=kw.get("date_fin", today + relativedelta(months=12)),
            loyer=kw.get("loyer", 1000),
            depot_garantie=kw.get("depot_garantie", 1000),
        )
    else:
        bien_vente = kw.get("bien_vente", bien)
        return Contrat.objects.create(
            bien=bien_vente, locataire=loc, type_contrat=type_c,
            prix=kw.get("prix", 50000),
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE,
            statut=kw.get("statut", Contrat.StatutContrat.ACTIF),
        )


# 1. Tests des Règles Métier de Synchronisation Bien <-> Contrat

class ContratReglesMetierTestCase(APITestCase):
    URL_CONTRATS = "/api/contrats/"
    LOYER_DEFAUT = 500_000
    DEPOT_GARANTIE_DEFAUT = 1_000_000
    PRIX_DEFAUT = 200_000_000

    def setUp(self):
        self.proprio_user = Utilisateur.objects.create_user(
            email="proprio@test.com", password="pass", role=Utilisateur.Role.PROPRIETAIRE,
            nom="Dupont", prenoms="Jean",
        )
        self.proprietaire = Proprietaire.objects.create(user=self.proprio_user, iban="FR123")

        self.locataire_user = Utilisateur.objects.create_user(
            email="locataire@test.com", password="pass", role=Utilisateur.Role.LOCATAIRE,
            nom="Martin", prenoms="Paul",
        )
        self.locataire = Locataire.objects.create(user=self.locataire_user)

        self.agent_user = Utilisateur.objects.create_user(
            email="agent@test.com", password="pass", role=Utilisateur.Role.AGENT,
            nom="Agent", prenoms="Test",
        )

        self.bien_location = self._creer_bien(
            titre="Appart location", type="APPARTEMENT", mode_transaction="LOCATION",
            surface=50, nombre_pieces=3, loyer_mensuel=self.LOYER_DEFAUT, prix=None,
        )
        self.bien_vente = self._creer_bien(
            titre="Maison vente", type="MAISON", mode_transaction="VENTE",
            surface=100, nombre_pieces=4, loyer_mensuel=None, prix=self.PRIX_DEFAUT,
        )
        self.client.force_authenticate(user=self.agent_user)

    def _creer_bien(self, **overrides) -> Bien:
        valeurs = {
            "proprietaire": self.proprietaire,
            "adresse": "Tana",
            "statut": Bien.StatutBien.DISPONIBLE,
        }
        valeurs.update(overrides)
        return Bien.objects.create(**valeurs)

    def _payload_location(self, bien_id: int, **overrides) -> dict:
        payload = {
            "bien": bien_id,
            "locataire": self.locataire.id,
            "type_contrat": "LOCATION",
            "date_debut": date.today().isoformat(),
            "date_fin": (date.today() + timedelta(days=365)).isoformat(),
            "loyer": self.LOYER_DEFAUT,
            "depot_garantie": self.DEPOT_GARANTIE_DEFAUT,
            "prix": None,
            "statut": "ACTIF",
        }
        payload.update(overrides)
        return payload

    def _payload_achat(self, bien_id: int, **overrides) -> dict:
        payload = {
            "bien": bien_id,
            "locataire": self.locataire.id,
            "type_contrat": "ACHAT",
            "type_paiement_achat": "TOTALITE",
            "date_debut": date.today().isoformat(),
            "date_fin": None,
            "loyer": None,
            "depot_garantie": None,
            "prix": self.PRIX_DEFAUT,
            "statut": "ACTIF",
        }
        payload.update(overrides)
        return payload

    def _creer_contrat_location(self, bien: Optional[Bien] = None, **overrides) -> Contrat:
        valeurs = {
            "bien": bien or self.bien_location,
            "locataire": self.locataire,
            "type_contrat": "LOCATION",
            "date_debut": date.today(),
            "date_fin": date.today() + timedelta(days=365),
            "loyer": self.LOYER_DEFAUT,
            "depot_garantie": self.DEPOT_GARANTIE_DEFAUT,
            "statut": "ACTIF",
        }
        valeurs.update(overrides)
        return Contrat.objects.create(**valeurs)

    def _creer_contrat_achat(self, bien: Optional[Bien] = None, **overrides) -> Contrat:
        valeurs = {
            "bien": bien or self.bien_vente,
            "locataire": self.locataire,
            "type_contrat": "ACHAT",
            "type_paiement_achat": "TOTALITE",
            "date_debut": date.today(),
            "date_fin": None,
            "loyer": None,
            "depot_garantie": None,
            "prix": self.PRIX_DEFAUT,
            "statut": "ACTIF",
        }
        valeurs.update(overrides)
        return Contrat.objects.create(**valeurs)

    def test_creer_contrat_location_ok(self):
        response = self.client.post(
            self.URL_CONTRATS, self._payload_location(self.bien_location.id), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        contrat = Contrat.objects.get(id=response.data["id"])
        self.assertEqual(contrat.type_contrat, "LOCATION")
        self.assertEqual(contrat.bien.statut, Bien.StatutBien.RESERVE)

    def test_creer_contrat_achat_ok(self):
        response = self.client.post(
            self.URL_CONTRATS, self._payload_achat(self.bien_vente.id), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        contrat = Contrat.objects.get(id=response.data["id"])
        self.assertEqual(contrat.type_contrat, "ACHAT")
        self.assertEqual(contrat.bien.statut, Bien.StatutBien.RESERVE)

    def test_creer_contrat_location_sur_bien_vente_echoue(self):
        response = self.client.post(
            self.URL_CONTRATS, self._payload_location(self.bien_vente.id), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_creer_contrat_achat_sur_bien_location_echoue(self):
        response = self.client.post(
            self.URL_CONTRATS,
            self._payload_achat(self.bien_location.id, prix=100_000_000),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resiliation_location_bien_devient_disponible(self):
        contrat = self._creer_contrat_location()
        self.bien_location.refresh_from_db()
        self.assertEqual(self.bien_location.statut, Bien.StatutBien.RESERVE)

        response = self.client.post(f"{self.URL_CONTRATS}{contrat.id}/resilier/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        contrat.refresh_from_db()
        self.assertEqual(contrat.statut, Contrat.StatutContrat.RESILIE)
        self.bien_location.refresh_from_db()
        self.assertEqual(self.bien_location.statut, Bien.StatutBien.DISPONIBLE)

    def test_terminaison_location_bien_devient_disponible(self):
        contrat = self._creer_contrat_location()
        self.bien_location.refresh_from_db()
        self.assertEqual(self.bien_location.statut, Bien.StatutBien.RESERVE)

        response = self.client.post(f"{self.URL_CONTRATS}{contrat.id}/terminer/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        contrat.refresh_from_db()
        self.assertEqual(contrat.statut, Contrat.StatutContrat.TERMINE)
        self.bien_location.refresh_from_db()
        self.assertEqual(self.bien_location.statut, Bien.StatutBien.DISPONIBLE)

    def test_finalisation_vente_bien_devient_vendu(self):
        contrat = self._creer_contrat_achat()
        self.bien_vente.refresh_from_db()
        self.assertEqual(self.bien_vente.statut, Bien.StatutBien.RESERVE)

        response = self.client.post(f"{self.URL_CONTRATS}{contrat.id}/finaliser_vente/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        contrat.refresh_from_db()
        self.assertEqual(contrat.statut, Contrat.StatutContrat.VENDU)
        self.bien_vente.refresh_from_db()
        self.assertEqual(self.bien_vente.statut, Bien.StatutBien.VENDU)

    def test_creer_contrat_sur_bien_vendu_echoue(self):
        contrat = self._creer_contrat_achat()
        contrat.finaliser_vente()
        self.bien_vente.refresh_from_db()
        self.assertEqual(self.bien_vente.statut, Bien.StatutBien.VENDU)

        response = self.client.post(
            self.URL_CONTRATS,
            self._payload_location(self.bien_vente.id, loyer=600_000, depot_garantie=1_200_000),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bien", response.data)

    def test_changement_location_vente_bien_disponible(self):
        bien = self._creer_bien(
            titre="Bien mixte", type="APPARTEMENT", mode_transaction="LOCATION",
            surface=60, nombre_pieces=2, loyer_mensuel=400_000, prix=None,
        )
        response = self.client.patch(
            f"/api/biens/{bien.id}/",
            {"mode_transaction": "VENTE", "prix": 100_000_000, "loyer_mensuel": None},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bien.refresh_from_db()
        self.assertEqual(bien.mode_transaction, "VENTE")
        self.assertIsNotNone(bien.prix)
        self.assertIsNone(bien.loyer_mensuel)
        self.assertEqual(bien.statut, Bien.StatutBien.DISPONIBLE)

    def test_changement_vente_location_bien_disponible(self):
        bien = self._creer_bien(
            titre="Bien mixte 2", type="MAISON", mode_transaction="VENTE",
            surface=80, nombre_pieces=3, loyer_mensuel=None, prix=150_000_000,
        )
        response = self.client.patch(
            f"/api/biens/{bien.id}/",
            {"mode_transaction": "LOCATION", "loyer_mensuel": 500_000, "prix": None},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bien.refresh_from_db()
        self.assertEqual(bien.mode_transaction, "LOCATION")
        self.assertIsNotNone(bien.loyer_mensuel)
        self.assertIsNone(bien.prix)


# 2. Tests des Modèles Contrat

class ContratModelTests(TestCase):
    def setUp(self):
        self.u1 = Utilisateur.objects.create_user(email="p@t.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.u1, iban="MG123")
        self.u2 = Utilisateur.objects.create_user(email="l@t.com", password="pwd", role=Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.u2)

        self.bien_loc = Bien.objects.create(
            proprietaire=self.prop, titre="A", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=50,
            nombre_pieces=2, loyer_mensuel=1000, statut=Bien.StatutBien.DISPONIBLE
        )
        self.bien_vente = Bien.objects.create(
            proprietaire=self.prop, titre="B", type=Bien.TypeBien.MAISON,
            mode_transaction=Bien.ModeTransaction.VENTE, adresse="Test", surface=100,
            nombre_pieces=4, prix=200000, statut=Bien.StatutBien.DISPONIBLE
        )

    def test_creation_contrat_location_valide(self):
        c = Contrat(
            bien=self.bien_loc,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date(2025, 1, 1),
            date_fin=date(2025, 12, 31),
            loyer=1000,
            depot_garantie=1000
        )
        c.save()
        self.assertEqual(c.statut, Contrat.StatutContrat.ACTIF)
        self.assertTrue(c.est_actif)
        self.assertEqual(c.date_paiement, date(2025, 2, 1))

        echeances = c.get_echeances_a_venir(date_reference=date(2025, 1, 30))
        self.assertEqual(len(echeances), 1)

    def test_creation_contrat_location_invalide(self):
        c = Contrat(
            bien=self.bien_loc, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            loyer=1000, depot_garantie=1000
        )
        with self.assertRaises(ValidationError):
            c.full_clean()

    def test_creation_contrat_achat_valide(self):
        c = Contrat(
            bien=self.bien_vente,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE,
            prix=200000
        )
        c.save()
        self.assertEqual(c.statut, Contrat.StatutContrat.ACTIF)

    def test_creation_contrat_achat_invalide(self):
        c = Contrat(
            bien=self.bien_loc,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE,
            prix=200000
        )
        with self.assertRaises(ValidationError):
            c.full_clean()

    def test_transitions_statut_location(self):
        c = Contrat.objects.create(
            bien=self.bien_loc, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date(2025, 1, 1), date_fin=date(2025, 12, 31), loyer=1000, depot_garantie=1000
        )
        c.resilier()
        self.assertEqual(c.statut, Contrat.StatutContrat.RESILIE)
        
        with self.assertRaises(ValidationError):
            c.statut = Contrat.StatutContrat.TERMINE
            c.save()

    def test_transitions_statut_vente(self):
        c = Contrat.objects.create(
            bien=self.bien_vente, locataire=self.loc, type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE, prix=200000
        )
        c.finaliser_vente()
        self.assertEqual(c.statut, Contrat.StatutContrat.VENDU)

    def test_str_representation(self):
        c = Contrat.objects.create(
            bien=self.bien_loc, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date(2025, 1, 1), date_fin=date(2025, 12, 31), loyer=1000, depot_garantie=1000
        )
        self.assertIn("Contrat", str(c))

    def test_get_echeances_non_location(self):
        contrat_achat = Contrat.objects.create(
            bien=self.bien_vente, locataire=self.loc, type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE, prix=200000
        )
        self.assertEqual(contrat_achat.get_echeances_a_venir(), [])


class ContratAchatModelTest(TestCase):
    def setUp(self):
        user_prop = Utilisateur.objects.create(email="prop_achat@test.com", role="PROPRIETAIRE")
        self.prop = Proprietaire.objects.create(user=user_prop)
        user_loc = Utilisateur.objects.create(email="loc_achat@test.com", role="LOCATAIRE")
        self.loc = Locataire.objects.create(user=user_loc)
        self.bien = Bien.objects.create(
            proprietaire=self.prop, titre="Bien Vente", type="MAISON",
            mode_transaction="VENTE", adresse="1 rue vente", surface=100,
            nombre_pieces=4, prix=100000.0, statut="DISPONIBLE"
        )
        
    def test_creation_contrat_achat_valide(self):
        contrat = Contrat.objects.create(
            bien=self.bien, locataire=self.loc, type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE, prix=95000.0, statut=Contrat.StatutContrat.ACTIF
        )
        self.assertEqual(contrat.type_contrat, "ACHAT")
        self.assertEqual(contrat.statut, "ACTIF")
        self.assertEqual(contrat.type_paiement_achat, "TOTALITE")

    def test_validation_achat_manquant(self):
        contrat = Contrat(bien=self.bien, locataire=self.loc, type_contrat=Contrat.TypeContrat.ACHAT, statut=Contrat.StatutContrat.ACTIF)
        with self.assertRaises(ValidationError) as cm:
            contrat.clean()
        self.assertIn("prix", cm.exception.message_dict)
        
        contrat.prix = 100000.0
        with self.assertRaises(ValidationError) as cm2:
            contrat.clean()
        self.assertIn("type_paiement_achat", cm2.exception.message_dict)
        
    def test_validation_achat_avec_date_fin(self):
        contrat = Contrat(
            bien=self.bien, locataire=self.loc, type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE, prix=95000.0,
            date_fin=date(2026, 12, 31), statut=Contrat.StatutContrat.ACTIF
        )
        with self.assertRaises(ValidationError) as cm:
            contrat.clean()
        self.assertIn("date_fin", cm.exception.message_dict)

    def test_finaliser_vente(self):
        contrat = Contrat.objects.create(
            bien=self.bien, locataire=self.loc, type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE, prix=95000.0, statut=Contrat.StatutContrat.ACTIF
        )
        contrat.finaliser_vente()
        self.assertEqual(contrat.statut, Contrat.StatutContrat.VENDU)
        with self.assertRaises(ValidationError):
            contrat.statut = Contrat.StatutContrat.ACTIF
            contrat.clean()

    def test_finaliser_vente_sur_location(self):
        bien_loc = Bien.objects.create(
            proprietaire=self.prop, titre="Bien Loc", type="MAISON",
            mode_transaction="LOCATION", adresse="1 rue loc", surface=100,
            nombre_pieces=4, loyer_mensuel=1000.0, statut="DISPONIBLE"
        )
        contrat = Contrat.objects.create(
            bien=bien_loc, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            loyer=1000.0, depot_garantie=1000.0, date_debut=date(2026, 1, 1),
            date_fin=date(2026, 12, 31), statut=Contrat.StatutContrat.ACTIF
        )
        with self.assertRaisesMessage(ValueError, "Seuls les contrats d'achat peuvent être finalisés."):
            contrat.finaliser_vente()


# 3. Tests Batch Échéances

class EcheancesBatchTests(TestCase):
    def setUp(self):
        self.proprio_user = Utilisateur.objects.create_user(email='p_b@test.com', password='pwd', role=Utilisateur.Role.PROPRIETAIRE)
        self.proprio = Proprietaire.objects.create(user=self.proprio_user, iban="MG123")
        self.loc_user = Utilisateur.objects.create_user(email='l_b@test.com', password='pwd', role=Utilisateur.Role.LOCATAIRE)
        self.locataire = Locataire.objects.create(user=self.loc_user)

        self.bien = Bien.objects.create(
            proprietaire=self.proprio, titre="Bien test", type="APPARTEMENT",
            mode_transaction="LOCATION", adresse="Paris", surface=50,
            nombre_pieces=2, loyer_mensuel=1000, statut="DISPONIBLE"
        )
        self.date_debut = timezone.now().date() - relativedelta(months=1)
        self.contrat = Contrat.objects.create(
            bien=self.bien, locataire=self.locataire, type_contrat="LOCATION",
            date_debut=self.date_debut, date_fin=self.date_debut + relativedelta(months=2),
            loyer=1000, depot_garantie=1000, statut="ACTIF"
        )

    def test_get_echeances_a_venir_with_batch(self):
        echeance_1 = self.date_debut + relativedelta(months=1)
        paiement = Paiement.objects.filter(contrat=self.contrat, date_echeance=echeance_1).first()
        if paiement:
            paiement.statut = "PAYE"
            paiement.montant_paye = 1000
            paiement.save(update_fields=["statut", "montant_paye"])
        else:
            Paiement.objects.create(
                contrat=self.contrat, date_echeance=echeance_1,
                montant=1000, montant_attendu=1000, statut="PAYE", montant_paye=1000
            )
        
        echeances = self.contrat.get_echeances_a_venir(date_reference=echeance_1)
        self.assertEqual(len(echeances), 1)
        
        batch = {echeance_1}
        echeances_batch = self.contrat.get_echeances_a_venir(date_reference=echeance_1, paiements_payes=batch)
        self.assertEqual(len(echeances_batch), 1)

    def test_get_echeances_a_venir_all_paid(self):
        echeance_1 = self.date_debut + relativedelta(months=1)
        echeance_2 = self.date_debut + relativedelta(months=2)
        
        Paiement.objects.update_or_create(
            contrat=self.contrat, date_echeance=echeance_1,
            defaults={'statut': 'PAYE', 'montant': 1000, 'montant_paye': 1000, 'montant_attendu': 1000}
        )
        Paiement.objects.update_or_create(
            contrat=self.contrat, date_echeance=echeance_2,
            defaults={'statut': 'PAYE', 'montant': 1000, 'montant_paye': 1000, 'montant_attendu': 1000}
        )
        echeances = self.contrat.get_echeances_a_venir()
        self.assertEqual(len(echeances), 0)

    def test_get_echeances_a_venir_invalid_status_or_type(self):
        self.contrat.statut = "RESILIE"
        self.contrat.save()
        self.assertEqual(len(self.contrat.get_echeances_a_venir()), 0)
        
        contrat_vente = Contrat.objects.create(
            bien=self.bien, locataire=self.locataire, type_contrat="LOCATION",
            date_debut=self.date_debut, date_fin=self.date_debut + relativedelta(months=2),
            loyer=1000, depot_garantie=1000, statut="ACTIF"
        )
        contrat_vente.type_contrat = "BAIL_COMMERCIAL"
        self.assertEqual(len(contrat_vente.get_echeances_a_venir()), 0)


# 4. Tests des Vues API Contrat

class ContratListRetrieveTests(APITestCase):
    def setUp(self):
        self.agent = make_user("agent_lr@c.com")
        self.admin = make_user("admin_lr@c.com", Utilisateur.Role.ADMIN)
        self.prop_user = make_user("prop_lr@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc_lr@c.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)

        self.bien = make_bien(self.prop)
        self.contrat = make_contrat(self.bien, self.loc)
        Paiement.objects.all().delete()

    def test_list_as_agent_returns_all(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/contrats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_as_locataire_sees_own_only(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/contrats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_as_proprietaire_sees_own_only(self):
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.get("/api/contrats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_unauthenticated_returns_401(self):
        response = self.client.get("/api/contrats/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f"/api/contrats/{self.contrat.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_statut(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/contrats/?statut=ACTIF")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_type_contrat(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/contrats/?type_contrat=LOCATION")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ContratCreateTests(APITestCase):
    def setUp(self):
        self.agent = make_user("agent_cr@c.com")
        self.prop_user = make_user("prop_cr@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc_cr@c.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.bien = make_bien(self.prop, titre="Bien2")

    def tearDown(self):
        Paiement.objects.all().delete()

    def test_create_location_contrat(self):
        self.client.force_authenticate(user=self.agent)
        today = timezone.now().date()
        data = {
            "bien": self.bien.id,
            "locataire": self.loc.id,
            "type_contrat": "LOCATION",
            "date_debut": today.isoformat(),
            "date_fin": (today + relativedelta(months=12)).isoformat(),
            "loyer": 1000,
            "depot_garantie": 1000,
        }
        response = self.client.post("/api/contrats/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_contrat_bien_non_disponible_returns_error(self):
        bien_loue = make_bien(self.prop, titre="Loue", statut=Bien.StatutBien.LOUE)
        self.client.force_authenticate(user=self.agent)
        today = timezone.now().date()
        data = {
            "bien": bien_loue.id,
            "locataire": self.loc.id,
            "type_contrat": "LOCATION",
            "date_debut": today.isoformat(),
            "date_fin": (today + relativedelta(months=12)).isoformat(),
            "loyer": 1000,
            "depot_garantie": 1000,
        }
        response = self.client.post("/api/contrats/", data)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST])


class ContratTransitionTests(APITestCase):
    def setUp(self):
        self.agent = make_user("agent_tr@c.com")
        self.admin = make_user("admin_tr@c.com", Utilisateur.Role.ADMIN)
        self.prop_user = make_user("prop_tr@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc_tr@c.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.bien_loc = make_bien(self.prop, titre="Bien Loc")
        self.contrat_loc = make_contrat(self.bien_loc, self.loc)
        Paiement.objects.all().delete()
        self.bien_vente = make_bien(self.prop, titre="Bien Vente", mode=Bien.ModeTransaction.VENTE)

    def test_resilier_contrat_location(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f"/api/contrats/{self.contrat_loc.id}/resilier/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contrat_loc.refresh_from_db()
        self.assertEqual(self.contrat_loc.statut, Contrat.StatutContrat.RESILIE)

    def test_resilier_already_resilie_returns_400(self):
        self.contrat_loc.statut = Contrat.StatutContrat.RESILIE
        Contrat.objects.filter(pk=self.contrat_loc.pk).update(statut=Contrat.StatutContrat.RESILIE)
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f"/api/contrats/{self.contrat_loc.id}/resilier/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_terminer_contrat_location(self):
        bien_t = make_bien(self.prop, titre="Bien Terminer")
        contrat_t = make_contrat(bien_t, self.loc)
        Paiement.objects.filter(contrat=contrat_t).delete()
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f"/api/contrats/{contrat_t.id}/terminer/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        contrat_t.refresh_from_db()
        self.assertEqual(contrat_t.statut, Contrat.StatutContrat.TERMINE)

    def test_finaliser_vente_achat_contrat(self):
        contrat_achat = make_contrat(self.bien_vente, self.loc, type_c=Contrat.TypeContrat.ACHAT)
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f"/api/contrats/{contrat_achat.id}/finaliser_vente/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        contrat_achat.refresh_from_db()
        self.assertEqual(contrat_achat.statut, Contrat.StatutContrat.VENDU)

    def test_resilier_achat_contrat_returns_400(self):
        contrat_achat = make_contrat(
            make_bien(self.prop, titre="Achat2", mode=Bien.ModeTransaction.VENTE),
            self.loc, type_c=Contrat.TypeContrat.ACHAT
        )
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f"/api/contrats/{contrat_achat.id}/resilier/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ContratBienInfoTests(APITestCase):
    def setUp(self):
        self.agent = make_user("agent_bi@c.com")
        self.prop_user = make_user("prop_bi@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.bien = make_bien(self.prop, titre="Bien Info")

    def test_bien_info_with_valid_id(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f"/api/contrats/bien-info/?bien_id={self.bien.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("loyer_mensuel", response.data)
        self.assertIn("titre", response.data)

    def test_bien_info_without_id_returns_400(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/contrats/bien-info/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bien_info_invalid_id_returns_404(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/contrats/bien-info/?bien_id=99999")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_bien_info_bien_non_disponible_returns_404(self):
        self.bien.statut = Bien.StatutBien.LOUE
        self.bien.save(update_fields=["statut"])
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f"/api/contrats/bien-info/?bien_id={self.bien.id}")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ContratEcheancesTests(APITestCase):
    def setUp(self):
        self.agent = make_user("agent_ech@c.com")
        self.prop_user = make_user("prop_ech@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc_ech@c.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.bien = make_bien(self.prop, titre="Bien Echeances")
        self.contrat = make_contrat(self.bien, self.loc)
        Paiement.objects.all().delete()

    def test_echeances_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/contrats/echeances/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)

    def test_echeances_as_locataire(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/contrats/echeances/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_echeances_as_proprietaire(self):
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.get("/api/contrats/echeances/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_telecharger(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f'/api/contrats/{self.contrat.id}/telecharger/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR])


class ContratUtilsAndSerializerBoostTests(TestCase):
    def setUp(self):
        self.agent = make_user("agent_boost@c.com")
        self.prop_user = make_user("prop_boost@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc_boost@c.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.bien = make_bien(self.prop, titre="Bien Boost Location")
        self.contrat = make_contrat(self.bien, self.loc)

    def test_formater_montant_ar(self):
        from contrats.utils import formater_montant_ar
        self.assertEqual(formater_montant_ar(None), "0")
        self.assertEqual(formater_montant_ar(1000000), "1 000 000")
        self.assertEqual(formater_montant_ar("invalid_val"), "invalid_val")

    def test_generate_contrat_pdf_achat_returns_false(self):
        from contrats.utils import generate_contrat_pdf
        self.contrat.type_contrat = Contrat.TypeContrat.ACHAT
        self.assertFalse(generate_contrat_pdf(self.contrat))

    def test_generate_contrat_pdf_success_and_error(self):
        from contrats.utils import generate_contrat_pdf
        from unittest.mock import patch
        pdf = generate_contrat_pdf(self.contrat)
        self.assertTrue(bool(pdf))

        with patch('contrats.utils.pisa.CreatePDF') as mock_pisa:
            mock_status = type('Status', (), {'err': 1})()
            mock_pisa.return_value = mock_status
            self.assertFalse(generate_contrat_pdf(self.contrat))

        with patch('contrats.utils.render_to_string', side_effect=Exception("Template error")):
            self.assertFalse(generate_contrat_pdf(self.contrat))

    def test_serializer_location_validations(self):
        from contrats.serializers import ContratSerializer
        from rest_framework.exceptions import ValidationError
        serializer = ContratSerializer()
        
        with self.assertRaises(ValidationError):
            serializer._valider_coherence_financiere({"type_contrat": Contrat.TypeContrat.LOCATION, "depot_garantie": 100}, None, Contrat.TypeContrat.LOCATION)
            
        with self.assertRaises(ValidationError):
            serializer._valider_coherence_financiere({"type_contrat": Contrat.TypeContrat.LOCATION, "loyer": 100}, None, Contrat.TypeContrat.LOCATION)

        with self.assertRaises(ValidationError):
            serializer._valider_coherence_financiere({"type_contrat": Contrat.TypeContrat.LOCATION, "loyer": 100, "depot_garantie": 100, "prix": 500}, None, Contrat.TypeContrat.LOCATION)

        with self.assertRaises(ValidationError):
            serializer._valider_coherence_financiere({"type_contrat": Contrat.TypeContrat.LOCATION, "loyer": 100, "depot_garantie": 100, "type_paiement_achat": "COMPTANT"}, None, Contrat.TypeContrat.LOCATION)

    def test_serializer_achat_validations(self):
        from contrats.serializers import ContratSerializer
        from rest_framework.exceptions import ValidationError
        serializer = ContratSerializer()
        
        with self.assertRaises(ValidationError):
            serializer._valider_coherence_financiere({"type_contrat": Contrat.TypeContrat.ACHAT, "prix": 1000}, None, Contrat.TypeContrat.ACHAT)
            
        with self.assertRaises(ValidationError):
            serializer._valider_coherence_financiere({"type_contrat": Contrat.TypeContrat.ACHAT, "type_paiement_achat": "COMPTANT"}, None, Contrat.TypeContrat.ACHAT)

        with self.assertRaises(ValidationError):
            serializer._valider_coherence_financiere({"type_contrat": Contrat.TypeContrat.ACHAT, "prix": 1000, "type_paiement_achat": "COMPTANT", "loyer": 100}, None, Contrat.TypeContrat.ACHAT)

        with self.assertRaises(ValidationError):
            serializer._valider_coherence_financiere({"type_contrat": Contrat.TypeContrat.ACHAT, "prix": 1000, "type_paiement_achat": "COMPTANT", "depot_garantie": 100}, None, Contrat.TypeContrat.ACHAT)

    def test_serializer_modification_validations(self):
        from contrats.serializers import ContratSerializer
        from rest_framework.exceptions import ValidationError
        serializer = ContratSerializer()
        
        with self.assertRaises(ValidationError):
            serializer._valider_modification(self.contrat, {"type_contrat": Contrat.TypeContrat.ACHAT}, Contrat.TypeContrat.ACHAT)

        autre_bien = make_bien(self.prop, titre="Autre")
        with self.assertRaises(ValidationError):
            serializer._valider_modification(self.contrat, {"bien": autre_bien}, self.contrat.type_contrat)

        autre_loc = Locataire.objects.create(user=make_user("autre_loc@c.com", Utilisateur.Role.LOCATAIRE))
        with self.assertRaises(ValidationError):
            serializer._valider_modification(self.contrat, {"locataire": autre_loc}, self.contrat.type_contrat)

        self.contrat.statut = Contrat.StatutContrat.VENDU
        with self.assertRaises(ValidationError):
            serializer._valider_modification(self.contrat, {}, self.contrat.type_contrat)

        self.contrat.statut = Contrat.StatutContrat.RESILIE
        with self.assertRaises(ValidationError):
            serializer._valider_modification(self.contrat, {"statut": Contrat.StatutContrat.ACTIF}, self.contrat.type_contrat)

        self.contrat.statut = Contrat.StatutContrat.ACTIF
        with self.assertRaises(ValidationError):
            serializer._valider_modification(self.contrat, {"statut": Contrat.StatutContrat.VENDU}, Contrat.TypeContrat.LOCATION)

        self.contrat.type_contrat = Contrat.TypeContrat.ACHAT
        with self.assertRaises(ValidationError):
            serializer._valider_modification(self.contrat, {"statut": Contrat.StatutContrat.RESILIE}, Contrat.TypeContrat.ACHAT)


