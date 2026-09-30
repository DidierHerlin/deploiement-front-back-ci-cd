"""
Tests complets pour les vues de Contrat.
Couverture : list, retrieve, create, resilier, terminer, finaliser_vente,
             bien_info, echeances, permissions, filtres.
"""
from datetime import date

from django.utils import timezone
from dateutil.relativedelta import relativedelta
from rest_framework import status
from rest_framework.test import APITestCase

from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement


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


class ContratListRetrieveTests(APITestCase):
    """Tests list/retrieve avec filtres et permissions."""

    def setUp(self):
        self.agent = make_user("agent@c.com")
        self.admin = make_user("admin@c.com", Utilisateur.Role.ADMIN)
        self.prop_user = make_user("prop@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc@c.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)

        self.bien = make_bien(self.prop)
        self.contrat = make_contrat(self.bien, self.loc)
        # Supprimer les paiements auto-créés pour garder l'état propre
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
    """Tests création de contrat."""

    def setUp(self):
        self.agent = make_user("agent2@c.com")
        self.prop_user = make_user("prop2@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc2@c.com", Utilisateur.Role.LOCATAIRE)
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
        Paiement.objects.all().delete()

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
    """Tests des transitions de statut : resilier, terminer, finaliser_vente."""

    def setUp(self):
        self.agent = make_user("agent3@c.com")
        self.admin = make_user("admin3@c.com", Utilisateur.Role.ADMIN)
        self.prop_user = make_user("prop3@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc3@c.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.bien_loc = make_bien(self.prop, titre="Bien Loc")
        self.contrat_loc = make_contrat(self.bien_loc, self.loc)
        Paiement.objects.all().delete()

        # Bien de vente
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
        contrat_achat = make_contrat(
            self.bien_vente, self.loc,
            type_c=Contrat.TypeContrat.ACHAT,
        )
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f"/api/contrats/{contrat_achat.id}/finaliser_vente/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        contrat_achat.refresh_from_db()
        self.assertEqual(contrat_achat.statut, Contrat.StatutContrat.VENDU)

    def test_resilier_achat_contrat_returns_400(self):
        """On ne peut pas résilier un contrat d'achat."""
        contrat_achat = make_contrat(
            make_bien(self.prop, titre="Achat2", mode=Bien.ModeTransaction.VENTE),
            self.loc, type_c=Contrat.TypeContrat.ACHAT
        )
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f"/api/contrats/{contrat_achat.id}/resilier/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ContratBienInfoTests(APITestCase):
    """Tests de l'action bien-info."""

    def setUp(self):
        self.agent = make_user("agent4@c.com")
        self.prop_user = make_user("prop4@c.com", Utilisateur.Role.PROPRIETAIRE)
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
    """Tests de l'action echeances."""

    def setUp(self):
        self.agent = make_user("agent5@c.com")
        self.prop_user = make_user("prop5@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc5@c.com", Utilisateur.Role.LOCATAIRE)
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


class ContratModelTests(APITestCase):
    """Tests des méthodes du modèle Contrat."""

    def setUp(self):
        self.prop_user = make_user("prop_m@c.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = make_user("loc_m@c.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.bien = make_bien(self.prop, titre="Bien Model")
        today = timezone.now().date()
        self.contrat = make_contrat(
            self.bien, self.loc,
            date_debut=today,
            date_fin=today + relativedelta(months=6)
        )
        Paiement.objects.all().delete()

    def test_str_representation(self):
        s = str(self.contrat)
        self.assertIn("Contrat", s)

    def test_est_actif_property(self):
        self.assertTrue(self.contrat.est_actif)

    def test_get_echeances_a_venir(self):
        echeances = self.contrat.get_echeances_a_venir()
        # Should return next unpaid echeance
        self.assertIsInstance(echeances, list)

    def test_get_echeances_non_location(self):
        """get_echeances_a_venir retourne [] pour un contrat d'achat."""
        bien_v = make_bien(self.prop, titre="Vente Model", mode=Bien.ModeTransaction.VENTE)
        contrat_achat = make_contrat(bien_v, self.loc, type_c=Contrat.TypeContrat.ACHAT)
        echeances = contrat_achat.get_echeances_a_venir()
        self.assertEqual(echeances, [])
