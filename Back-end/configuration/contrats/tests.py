"""Tests des règles métier de synchronisation Bien <-> Contrat (location et achat)."""

from datetime import date, timedelta
from typing import Optional

from rest_framework import status
from rest_framework.test import APITestCase

from bien.models import Bien
from contrats.models import Contrat
from utilisateur.models import Locataire, Proprietaire, Utilisateur


class ContratReglesMetierTestCase(APITestCase):
    """
    Couvre la synchronisation automatique Bien.statut <-> Contrat pour les
    deux types de contrat (LOCATION et ACHAT), ainsi que les validations
    croisées bien/contrat (mode_transaction, disponibilité du bien).
    """

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

        # Agent pour créer les contrats (droits d'écriture nécessaires).
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

    # ------------------------------------------------------------------
    # Fixtures / helpers de construction (réduisent la duplication)
    # ------------------------------------------------------------------
    def _creer_bien(self, **overrides) -> Bien:
        """Crée un Bien DISPONIBLE avec des valeurs par défaut communes aux tests."""
        valeurs = {
            "proprietaire": self.proprietaire,
            "adresse": "Tana",
            "statut": Bien.StatutBien.DISPONIBLE,
        }
        valeurs.update(overrides)
        return Bien.objects.create(**valeurs)

    def _payload_location(self, bien_id: int, **overrides) -> dict:
        """Payload API de création d'un contrat LOCATION (mêmes valeurs par défaut partout)."""
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
        """Payload API de création d'un contrat ACHAT."""
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
        """Crée directement (hors API) un contrat de location ACTIF."""
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
        """Crée directement (hors API) un contrat d'achat ACTIF (non finalisé)."""
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

    # ------------------------------------------------------------------
    # Création de contrats — cohérence type_contrat / mode_transaction
    # ------------------------------------------------------------------
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
        self.assertEqual(contrat.bien.statut, Bien.StatutBien.RESERVE)  # passe en reserve après génération échéances

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

    # ------------------------------------------------------------------
    # Transitions de statut — location
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    # Transitions de statut — vente
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    # Changement de mode de transaction d'un bien disponible
    # ------------------------------------------------------------------
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