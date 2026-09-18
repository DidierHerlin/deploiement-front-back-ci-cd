from rest_framework import status
from rest_framework.test import APITestCase

from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from reservation.models import Reservation
from notifications.models import Notification

class ReservationViewsTests(APITestCase):

    def setUp(self):
        # Create users
        self.admin = Utilisateur.objects.create_user(
            email="admin@test.com", password="password123", role=Utilisateur.Role.ADMIN, nom="Admin", prenoms="Test"
        )
        self.agent = Utilisateur.objects.create_user(
            email="agent@test.com", password="password123", role=Utilisateur.Role.AGENT, nom="Agent", prenoms="Test"
        )
        self.locataire_user = Utilisateur.objects.create_user(
            email="locataire@test.com", password="password123", role=Utilisateur.Role.LOCATAIRE, nom="Loc", prenoms="Ataire"
        )
        self.locataire = Locataire.objects.create(user=self.locataire_user)

        self.proprietaire_user = Utilisateur.objects.create_user(
            email="proprio@test.com", password="password123", role=Utilisateur.Role.PROPRIETAIRE, nom="Prop", prenoms="Ietaire"
        )
        self.proprietaire = Proprietaire.objects.create(user=self.proprietaire_user)

        self.bien = Bien.objects.create(
            proprietaire=self.proprietaire,
            titre="Appartement",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION,
            adresse="Paris",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=1000.0,
            statut=Bien.StatutBien.DISPONIBLE
        )

        self.reservation = Reservation.objects.create(
            bien=self.bien,
            locataire=self.locataire,
            type_reservation=Reservation.TypeReservation.LOCATION,
            statut=Reservation.StatutReservation.EN_ATTENTE
        )

    def test_list_reservations_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/reservations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_list_reservations_as_locataire(self):
        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get("/api/reservations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_create_reservation(self):
        self.client.force_authenticate(user=self.locataire_user)
        data = {
            "bien": self.bien.id,
            "type_reservation": Reservation.TypeReservation.LOCATION
        }
        response = self.client.post("/api/reservations/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reservation.objects.count(), 2)

    def test_repondre_reservation(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "reponse_admin": "C'est validé",
            "statut": Reservation.StatutReservation.TRAITEE
        }
        response = self.client.post(f"/api/reservations/{self.reservation.id}/repondre/", data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.statut, Reservation.StatutReservation.TRAITEE)
        self.assertEqual(self.reservation.reponse_admin, "C'est validé")
        
        # Check if notification was created
        self.assertTrue(Notification.objects.filter(utilisateur=self.locataire_user).exists())
