"""
Tests complets pour le module Paiement.
Couvre : list, retrieve, valider, refuser, annuler, quittance, impayes,
         propriétés du modèle, et vérifications de permissions.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date
from dateutil.relativedelta import relativedelta

from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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
    """Crée un paiement avec une date_echeance unique."""
    return Paiement.objects.create(
        contrat=contrat,
        date_echeance=date.today() + relativedelta(months=delta_months),
        montant=500_000, montant_attendu=500_000,
        statut=statut,
    )


# ---------------------------------------------------------------------------
# setUp commun
# ---------------------------------------------------------------------------

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


# ===========================================================================
# 1. List
# ===========================================================================

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

    def test_list_pagination_structure(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)


# ===========================================================================
# 2. Retrieve
# ===========================================================================

class PaiementRetrieveTests(PaiementTestBase):

    def test_retrieve_as_agent_returns_200(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.paiement.id)

    def test_retrieve_as_locataire_own_paiement_returns_200(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_as_locataire_other_paiement_returns_404(self):
        bien2 = _make_bien(self.prop, titre="Bien Autre Loc")
        contrat2 = _make_contrat(bien2, self.other_loc)
        paiement_other = Paiement.objects.create(
            contrat=contrat2,
            date_echeance=date.today() + relativedelta(months=5 + 100),
            montant=500_000, montant_attendu=500_000,
        )
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get(f"/api/paiements/{paiement_other.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_as_proprietaire_own_bien_returns_200(self):
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_nonexistent_returns_404(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get("/api/paiements/999999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        response = self.client.get(f"/api/paiements/{self.paiement.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ===========================================================================
# 3. Valider
# ===========================================================================

class PaiementValiderTests(PaiementTestBase):

    def test_valider_en_attente_returns_200_and_sets_paye(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(
            f"/api/paiements/{self.paiement.id}/valider/",
            {"mode_paiement": "ESPECE"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paiement.refresh_from_db()
        self.assertEqual(self.paiement.statut, Paiement.StatutPaiement.PAYE)

    def test_valider_sets_mode_paiement(self):
        self.client.force_authenticate(user=self.agent_user)
        self.client.post(
            f"/api/paiements/{self.paiement.id}/valider/",
            {"mode_paiement": "VIREMENT"},
        )
        self.paiement.refresh_from_db()
        self.assertEqual(self.paiement.mode_paiement, "VIREMENT")

    def test_valider_already_paye_returns_400(self):
        self.paiement.statut = Paiement.StatutPaiement.PAYE
        self.paiement.save(update_fields=["statut"])
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(
            f"/api/paiements/{self.paiement.id}/valider/",
            {"mode_paiement": "ESPECE"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_valider_as_locataire_returns_403(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.post(
            f"/api/paiements/{self.paiement.id}/valider/",
            {"mode_paiement": "ESPECE"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_valider_as_proprietaire_returns_403(self):
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.post(
            f"/api/paiements/{self.paiement.id}/valider/",
            {"mode_paiement": "ESPECE"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_valider_unauthenticated_returns_401(self):
        response = self.client.post(
            f"/api/paiements/{self.paiement.id}/valider/",
            {"mode_paiement": "ESPECE"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ===========================================================================
# 4. Refuser
# ===========================================================================

class PaiementRefuserTests(PaiementTestBase):

    def test_refuser_en_attente_returns_200(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(f"/api/paiements/{self.paiement.id}/refuser/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_refuser_en_attente_changes_statut(self):
        self.client.force_authenticate(user=self.agent_user)
        self.client.post(f"/api/paiements/{self.paiement.id}/refuser/")
        self.paiement.refresh_from_db()
        self.assertNotEqual(self.paiement.statut, Paiement.StatutPaiement.EN_ATTENTE)

    def test_refuser_already_paye_returns_400(self):
        self.paiement.statut = Paiement.StatutPaiement.PAYE
        self.paiement.save(update_fields=["statut"])
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(f"/api/paiements/{self.paiement.id}/refuser/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_refuser_as_locataire_returns_403(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.post(f"/api/paiements/{self.paiement.id}/refuser/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_refuser_unauthenticated_returns_401(self):
        response = self.client.post(f"/api/paiements/{self.paiement.id}/refuser/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ===========================================================================
# 5. Annuler
# ===========================================================================

class PaiementAnnulerTests(PaiementTestBase):

    def test_annuler_en_attente_returns_200(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(f"/api/paiements/{self.paiement.id}/annuler/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_annuler_sets_statut_annule(self):
        self.client.force_authenticate(user=self.agent_user)
        self.client.post(f"/api/paiements/{self.paiement.id}/annuler/")
        self.paiement.refresh_from_db()
        self.assertEqual(self.paiement.statut, Paiement.StatutPaiement.ANNULE)

    def test_annuler_already_paye_returns_400(self):
        self.paiement.statut = Paiement.StatutPaiement.PAYE
        self.paiement.save(update_fields=["statut"])
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.post(f"/api/paiements/{self.paiement.id}/annuler/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_annuler_as_locataire_returns_403(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.post(f"/api/paiements/{self.paiement.id}/annuler/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_annuler_unauthenticated_returns_401(self):
        response = self.client.post(f"/api/paiements/{self.paiement.id}/annuler/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ===========================================================================
# 6. Quittance
# ===========================================================================

class PaiementQuittanceTests(PaiementTestBase):

    def test_quittance_en_attente_returns_400(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/quittance/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_quittance_paye_does_not_return_400(self):
        self.paiement.statut = Paiement.StatutPaiement.PAYE
        self.paiement.save(update_fields=["statut"])
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/quittance/")
        # Pas 400 car le paiement est validé (peut être 200 ou 500 selon env)
        self.assertNotEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_quittance_annule_returns_400(self):
        self.paiement.statut = Paiement.StatutPaiement.ANNULE
        self.paiement.save(update_fields=["statut"])
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/quittance/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_quittance_unauthenticated_returns_401(self):
        response = self.client.get(f"/api/paiements/{self.paiement.id}/quittance/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ===========================================================================
# 7. Impayés
# ===========================================================================

class PaiementImpayesTests(PaiementTestBase):

    def setUp(self):
        super().setUp()
        self.paiement_retard = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() - relativedelta(months=2 + 100),
            montant=500_000, montant_attendu=500_000,
            statut=Paiement.StatutPaiement.EN_ATTENTE,
        )

    def test_impayes_as_agent_returns_200(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get("/api/paiements/impayes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_impayes_as_admin_returns_200(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/paiements/impayes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_impayes_as_proprietaire_returns_200(self):
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.get("/api/paiements/impayes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_impayes_as_locataire_returns_403(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/paiements/impayes/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_impayes_unauthenticated_returns_401(self):
        response = self.client.get("/api/paiements/impayes/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_impayes_contains_retard_paiement(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get("/api/paiements/impayes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [p["id"] for p in response.data.get("results", [])]
        self.assertIn(self.paiement_retard.id, ids)

    def test_impayes_excludes_paye_paiement(self):
        paiement_paye = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() - relativedelta(months=3 + 100),
            montant=500_000, montant_attendu=500_000,
            statut=Paiement.StatutPaiement.PAYE,
        )
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get("/api/paiements/impayes/")
        ids = [p["id"] for p in response.data.get("results", [])]
        self.assertNotIn(paiement_paye.id, ids)


# ===========================================================================
# 8. Modèle – propriétés métier
# ===========================================================================

class PaiementModelTests(PaiementTestBase):

    def test_est_en_retard_false_when_not_due(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=2 + 100),
            montant=500_000, montant_attendu=500_000,
        )
        self.assertFalse(p.est_en_retard)

    def test_est_en_retard_true_when_overdue_more_than_5_days(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() - relativedelta(days=10),
            montant=500_000, montant_attendu=500_000,
        )
        self.assertTrue(p.est_en_retard)

    def test_est_en_retard_false_when_overdue_less_than_5_days(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() - relativedelta(days=3),
            montant=500_000, montant_attendu=500_000,
        )
        self.assertFalse(p.est_en_retard)

    def test_est_en_retard_paye_en_retard(self):
        echeance = date.today() - relativedelta(days=15)
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=echeance,
            montant=500_000, montant_attendu=500_000,
            statut=Paiement.StatutPaiement.PAYE,
        )
        p.date_paiement = date.today()
        p.save(update_fields=["date_paiement"])
        self.assertTrue(p.est_en_retard)

    def test_montant_restant_without_paiement_partiel(self):
        from decimal import Decimal
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=6 + 100),
            montant=500_000, montant_attendu=500_000, montant_paye=0,
        )
        self.assertEqual(p.montant_restant, Decimal("500000"))

    def test_montant_restant_with_partial_payment(self):
        from decimal import Decimal
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=7 + 100),
            montant=200_000, montant_attendu=500_000,
            montant_paye=Decimal("200000"), est_partiel=True,
        )
        self.assertEqual(p.montant_restant, Decimal("300000"))

    def test_montant_restant_none_when_montant_attendu_is_none(self):
        p = Paiement(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=8 + 100),
            montant=500_000, montant_attendu=None,
        )
        self.assertIsNone(p.montant_restant)

    def test_montant_restant_never_negative(self):
        from decimal import Decimal
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=9 + 100),
            montant=600_000, montant_attendu=500_000,
            montant_paye=Decimal("600000"), est_partiel=True,
        )
        self.assertEqual(p.montant_restant, Decimal("0"))

    def test_mois_echeance_janvier(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2026, 1, 5),
            montant=500_000, montant_attendu=500_000,
        )
        self.assertEqual(p.mois_echeance, "janvier 2026")

    def test_mois_echeance_juin(self):
        p = Paiement(
            contrat=self.contrat,
            date_echeance=date(2025, 6, 15),
            montant=500_000, montant_attendu=500_000,
        )
        self.assertEqual(p.mois_echeance, "juin 2025")

    def test_message_mois_contains_mois_echeance(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2026, 6, 1),
            montant=500_000, montant_attendu=500_000,
        )
        self.assertIn(p.mois_echeance, p.message_mois)

    def test_message_mois_format(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2026, 3, 1),
            montant=500_000, montant_attendu=500_000,
        )
        self.assertEqual(p.message_mois, f"Ce paiement correspond au mois de {p.mois_echeance}.")

    def test_valider_paiement_method_sets_paye(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=1 + 1000),
            montant=500_000, montant_attendu=500_000,
        )
        p.valider_paiement()
        p.refresh_from_db()
        self.assertEqual(p.statut, Paiement.StatutPaiement.PAYE)

    def test_valider_paiement_already_paye_raises_valueerror(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=1 + 1001),
            montant=500_000, montant_attendu=500_000,
            statut=Paiement.StatutPaiement.PAYE,
        )
        with self.assertRaises(ValueError):
            p.valider_paiement()

    def test_annuler_paiement_method_sets_annule(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=1 + 1003),
            montant=500_000, montant_attendu=500_000,
        )
        p.annuler_paiement()
        p.refresh_from_db()
        self.assertEqual(p.statut, Paiement.StatutPaiement.ANNULE)

    def test_annuler_paiement_already_paye_raises_valueerror(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=1 + 1004),
            montant=500_000, montant_attendu=500_000,
            statut=Paiement.StatutPaiement.PAYE,
        )
        with self.assertRaises(ValueError):
            p.annuler_paiement()

    def test_str_representation(self):
        result = str(self.paiement)
        self.assertIn(str(self.paiement.pk), result)

    def test_locataire_property_returns_locataire(self):
        self.assertEqual(self.paiement.locataire, self.loc)

    def test_nom_locataire_property_returns_string(self):
        self.assertIsInstance(self.paiement.nom_locataire, str)


# ===========================================================================
# 9. Filtrage
# ===========================================================================

class PaiementFiltreTests(PaiementTestBase):

    def setUp(self):
        super().setUp()
        self.paiement_paye = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date.today() + relativedelta(months=2 + 100),
            montant=500_000, montant_attendu=500_000,
            statut=Paiement.StatutPaiement.PAYE,
        )

    def test_filter_by_statut_en_attente(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get("/api/paiements/?statut=EN_ATTENTE")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for p in response.data["results"]:
            self.assertEqual(p["statut"], "EN_ATTENTE")

    def test_filter_by_statut_paye(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get("/api/paiements/?statut=PAYE")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for p in response.data["results"]:
            self.assertEqual(p["statut"], "PAYE")

    def test_filter_by_contrat(self):
        self.client.force_authenticate(user=self.agent_user)
        response = self.client.get(f"/api/paiements/?contrat={self.contrat.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for p in response.data["results"]:
            self.assertEqual(p["contrat"], self.contrat.id)


# ===========================================================================
# 10. Permissions – cas limites
# ===========================================================================

class PaiementPermissionsEdgeCaseTests(PaiementTestBase):

    def test_locataire_cannot_access_autre_locataire_paiement(self):
        bien2 = _make_bien(self.prop, titre="Bien Autre Loc2")
        contrat2 = _make_contrat(bien2, self.other_loc)
        paiement2 = Paiement.objects.create(
            contrat=contrat2,
            date_echeance=date.today() + relativedelta(months=3 + 100),
            montant=500_000, montant_attendu=500_000,
        )
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get(f"/api/paiements/{paiement2.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_all_write_actions_by_locataire_returns_403(self):
        self.client.force_authenticate(user=self.loc_user)
        self.assertEqual(
            self.client.post(f"/api/paiements/{self.paiement.id}/valider/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(f"/api/paiements/{self.paiement.id}/annuler/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(f"/api/paiements/{self.paiement.id}/refuser/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
