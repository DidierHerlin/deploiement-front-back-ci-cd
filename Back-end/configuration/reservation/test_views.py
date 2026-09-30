"""
Tests complets pour les vues de Reservation.
Couverture : list, retrieve, create, repondre, filtres, permissions.
"""
from rest_framework import status
from rest_framework.test import APITestCase

from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from reservation.models import Reservation
from notifications.models import Notification


def make_user(email, role=Utilisateur.Role.LOCATAIRE, **kw):
    return Utilisateur.objects.create_user(
        email=email, password="pwd123", role=role,
        nom=kw.get("nom", "Test"), prenoms=kw.get("prenoms", "User")
    )


def make_bien(proprietaire, titre="Appart", mode=Bien.ModeTransaction.LOCATION, **kw):
    return Bien.objects.create(
        proprietaire=proprietaire, titre=titre,
        type=kw.get("type", Bien.TypeBien.APPARTEMENT),
        mode_transaction=mode, adresse=kw.get("adresse", "123 rue Test"),
        surface=50, nombre_pieces=2, 
        loyer_mensuel=1000.0 if mode == Bien.ModeTransaction.LOCATION else None,
        prix=kw.get("prix", 100000.0) if mode == Bien.ModeTransaction.VENTE else None,
        statut=kw.get("statut", Bien.StatutBien.DISPONIBLE)
    )


class ReservationListTests(APITestCase):
    """Tests pour la liste et le retrieve des réservations."""

    def setUp(self):
        self.admin = make_user("admin@r.com", Utilisateur.Role.ADMIN)
        self.agent = make_user("agent@r.com", Utilisateur.Role.AGENT)
        self.loc_user = make_user("loc@r.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.prop_user = make_user("prop@r.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.bien = make_bien(self.prop)
        self.reservation = Reservation.objects.create(
            bien=self.bien, locataire=self.loc,
            type_reservation=Reservation.TypeReservation.LOCATION,
            statut=Reservation.StatutReservation.EN_ATTENTE
        )

    def test_list_as_admin_returns_200(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/reservations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_as_agent_sees_all(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/reservations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_list_as_locataire_sees_own_only(self):
        # Autre locataire
        other_user = make_user("other@r.com", Utilisateur.Role.LOCATAIRE)
        other_loc = Locataire.objects.create(user=other_user)
        bien2 = make_bien(self.prop, titre="Bien2")
        Reservation.objects.create(
            bien=bien2, locataire=other_loc,
            type_reservation=Reservation.TypeReservation.LOCATION
        )
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/reservations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_list_unauthenticated_returns_401(self):
        response = self.client.get("/api/reservations/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_as_locataire(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get(f"/api/reservations/{self.reservation.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)

    def test_retrieve_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f"/api/reservations/{self.reservation.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_statut(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/reservations/?statut=EN_ATTENTE")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_filter_by_type(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/reservations/?type_reservation=LOCATION")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ReservationCreateTests(APITestCase):
    """Tests pour la création de réservations."""

    def setUp(self):
        self.admin = make_user("admin2@r.com", Utilisateur.Role.ADMIN)
        self.admin.is_active = True
        self.admin.save(update_fields=['is_active'])
        self.loc_user = make_user("loc2@r.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.prop_user = make_user("prop2@r.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.bien = make_bien(self.prop, titre="Bien Dispo")

    def test_create_reservation_as_locataire(self):
        self.client.force_authenticate(user=self.loc_user)
        data = {"bien": self.bien.id, "type_reservation": "LOCATION"}
        response = self.client.post("/api/reservations/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])

    def test_create_reservation_bien_non_disponible(self):
        """Bien déjà loué -> validation error."""
        self.bien.statut = Bien.StatutBien.LOUE
        self.bien.save(update_fields=["statut"])
        self.client.force_authenticate(user=self.loc_user)
        data = {"bien": self.bien.id, "type_reservation": "LOCATION"}
        response = self.client.post("/api/reservations/", data)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

    def test_create_notification_for_admin_on_reservation(self):
        """Une notification doit être envoyée aux admins à la création."""
        notif_count_before = Notification.objects.filter(utilisateur=self.admin).count()
        self.client.force_authenticate(user=self.loc_user)
        data = {"bien": self.bien.id, "type_reservation": "LOCATION"}
        self.client.post("/api/reservations/", data)
        notif_count_after = Notification.objects.filter(utilisateur=self.admin).count()
        self.assertGreater(notif_count_after, notif_count_before)


class ReservationRepondreTests(APITestCase):
    """Tests pour l'action repondre."""

    def setUp(self):
        self.admin = make_user("admin3@r.com", Utilisateur.Role.ADMIN)
        self.agent = make_user("agent3@r.com", Utilisateur.Role.AGENT)
        self.loc_user = make_user("loc3@r.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.prop_user = make_user("prop3@r.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.bien = make_bien(self.prop, titre="Bien3")
        self.reservation = Reservation.objects.create(
            bien=self.bien, locataire=self.loc,
            type_reservation=Reservation.TypeReservation.LOCATION,
            statut=Reservation.StatutReservation.EN_ATTENTE
        )

    def test_repondre_as_admin_traitee(self):
        self.client.force_authenticate(user=self.admin)
        data = {"reponse_admin": "Validé !", "statut": "TRAITEE"}
        response = self.client.post(
            f"/api/reservations/{self.reservation.id}/repondre/", data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.statut, Reservation.StatutReservation.TRAITEE)

    def test_repondre_as_agent_annulee(self):
        self.client.force_authenticate(user=self.agent)
        data = {"reponse_admin": "Annulé.", "statut": "ANNULEE"}
        response = self.client.post(
            f"/api/reservations/{self.reservation.id}/repondre/", data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.statut, Reservation.StatutReservation.ANNULEE)

    def test_repondre_already_treated_returns_400(self):
        """Répondre à une réservation déjà traitée -> 400."""
        self.reservation.statut = Reservation.StatutReservation.TRAITEE
        self.reservation.save(update_fields=["statut"])
        self.client.force_authenticate(user=self.admin)
        data = {"reponse_admin": "Encore une fois", "statut": "TRAITEE"}
        response = self.client.post(
            f"/api/reservations/{self.reservation.id}/repondre/", data
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_repondre_notifie_locataire(self):
        """La réponse doit créer une notification pour le locataire."""
        count_before = Notification.objects.filter(utilisateur=self.loc_user).count()
        self.client.force_authenticate(user=self.admin)
        data = {"reponse_admin": "OK", "statut": "TRAITEE"}
        self.client.post(f"/api/reservations/{self.reservation.id}/repondre/", data)
        count_after = Notification.objects.filter(utilisateur=self.loc_user).count()
        self.assertGreater(count_after, count_before)

    def test_repondre_as_locataire_forbidden(self):
        """Un locataire ne peut pas répondre à une réservation."""
        self.client.force_authenticate(user=self.loc_user)
        data = {"reponse_admin": "Hack", "statut": "TRAITEE"}
        response = self.client.post(
            f"/api/reservations/{self.reservation.id}/repondre/", data
        )
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])


class ReservationModelTests(APITestCase):
    """Tests pour les méthodes du modèle Reservation."""

    def setUp(self):
        self.loc_user = make_user("loc_m@r.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)
        self.prop_user = make_user("prop_m@r.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.bien = make_bien(self.prop, titre="BienModel")
        self.reservation = Reservation.objects.create(
            bien=self.bien, locataire=self.loc,
            type_reservation=Reservation.TypeReservation.LOCATION
        )

    def test_str_representation(self):
        s = str(self.reservation)
        self.assertIn("Réservation", s)
        self.assertIn("Location", s)

    def test_validation_type_location_sur_bien_vente(self):
        """Réserver un bien de vente en mode LOCATION -> erreur."""
        bien_vente = make_bien(self.prop, titre="Bien Vente", mode=Bien.ModeTransaction.VENTE)
        self.client.force_authenticate(user=self.loc_user)
        data = {"bien": bien_vente.id, "type_reservation": "LOCATION"}
        response = self.client.post("/api/reservations/", data)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST])
