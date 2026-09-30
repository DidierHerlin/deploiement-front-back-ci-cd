"""
Tests complets pour le module Notifications.
Couvre : authentification, filtres, comptage, détail, suppression,
         marquage comme lu, création et validation de données.
"""

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from utilisateur.models import Utilisateur
from notifications.models import Notification


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create_user(email, password="TestPass123!", role="LOCATAIRE"):
    """Crée un utilisateur avec le rôle donné."""
    return Utilisateur.objects.create_user(email=email, password=password, role=role)


def create_notification(utilisateur, type_notif="AUTRE", titre="Test", message="Corps du message", lu=False):
    """Crée une notification pour un utilisateur donné."""
    return Notification.objects.create(
        utilisateur=utilisateur,
        type=type_notif,
        titre=titre,
        message=message,
        lu=lu,
    )


# ---------------------------------------------------------------------------
# 1. NotificationListView
# ---------------------------------------------------------------------------

class NotificationListViewTest(APITestCase):
    """Tests pour GET notifications/ (liste des notifications)."""

    def setUp(self):
        self.user = create_user("list@test.com")
        self.client.force_authenticate(user=self.user)
        self.url = reverse("notification-list")

        self.n1 = create_notification(self.user, type_notif="AUTRE", titre="N1", lu=False)
        self.n2 = create_notification(self.user, type_notif="CONTRAT_CREE", titre="N2", lu=False)
        self.n3 = create_notification(self.user, type_notif="PAIEMENT_VALIDE", titre="N3", lu=True)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_all_notifications(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 3)

    def test_filter_unread_notifications(self):
        response = self.client.get(self.url, {"lu": "false"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for notif in response.data["results"]:
            self.assertFalse(notif["lu"])

    def test_filter_read_notifications(self):
        response = self.client.get(self.url, {"lu": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for notif in response.data["results"]:
            self.assertTrue(notif["lu"])

    def test_filter_by_type_autre(self):
        response = self.client.get(self.url, {"type": "AUTRE"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for notif in response.data["results"]:
            self.assertEqual(notif["type"], "AUTRE")

    def test_filter_by_type_contrat_cree(self):
        response = self.client.get(self.url, {"type": "CONTRAT_CREE"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for notif in response.data["results"]:
            self.assertEqual(notif["type"], "CONTRAT_CREE")

    def test_user_only_sees_own_notifications(self):
        other_user = create_user("other@test.com")
        other_notif = create_notification(other_user, titre="Notification autre user")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids_retournes = [notif["id"] for notif in response.data["results"]]
        self.assertIn(self.n1.id, ids_retournes)
        self.assertNotIn(other_notif.id, ids_retournes)


# ---------------------------------------------------------------------------
# 2. NotificationCountView
# ---------------------------------------------------------------------------

class NotificationCountViewTest(APITestCase):
    """Tests pour GET notifications/non-lues/count/."""

    def setUp(self):
        self.user = create_user("count@test.com")
        self.client.force_authenticate(user=self.user)
        self.url = reverse("notification-count")

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_count_zero_when_no_notifications(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_count_unread_notifications(self):
        create_notification(self.user, lu=False)
        create_notification(self.user, lu=False)
        create_notification(self.user, lu=True)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_count_decreases_after_marking_read(self):
        n = create_notification(self.user, lu=False)
        response = self.client.get(self.url)
        initial_count = response.data["count"]
        n.lu = True
        n.save()
        response = self.client.get(self.url)
        self.assertEqual(response.data["count"], initial_count - 1)


# ---------------------------------------------------------------------------
# 3. NotificationDetailView
# ---------------------------------------------------------------------------

class NotificationDetailViewTest(APITestCase):
    """Tests pour GET/DELETE notifications/<pk>/."""

    def setUp(self):
        self.user = create_user("detail@test.com")
        self.client.force_authenticate(user=self.user)
        self.notif = create_notification(self.user, titre="Détail test", lu=False)
        self.url = reverse("notification-detail", kwargs={"pk": self.notif.pk})

    def test_get_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_detail_marks_as_read(self):
        self.assertFalse(self.notif.lu)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.lu)

    def test_get_detail_returns_correct_data(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["id"], self.notif.id)
        self.assertEqual(response.data["data"]["titre"], "Détail test")

    def test_get_detail_not_found_returns_404(self):
        url_404 = reverse("notification-detail", kwargs={"pk": 99999})
        response = self.client.get(url_404)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_notification(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(pk=self.notif.pk).exists())

    def test_delete_notification_not_found_returns_404(self):
        url_404 = reverse("notification-detail", kwargs={"pk": 99999})
        response = self.client.delete(url_404)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_access_other_user_notification(self):
        other_user = create_user("other_detail@test.com")
        other_notif = create_notification(other_user, titre="Notif privée")
        url_other = reverse("notification-detail", kwargs={"pk": other_notif.pk})
        response = self.client.get(url_other)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_already_read_notification_stays_read(self):
        """GET sur une notif déjà lue ne doit pas planter."""
        self.notif.lu = True
        self.notif.save()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.lu)


# ---------------------------------------------------------------------------
# 4. MarquerLuView
# ---------------------------------------------------------------------------

class MarquerLuViewTest(APITestCase):
    """Tests pour POST notifications/marquer-lu/."""

    def setUp(self):
        self.user = create_user("marquer@test.com")
        self.client.force_authenticate(user=self.user)
        self.url = reverse("notification-marquer-lu")

        self.n1 = create_notification(self.user, titre="M1", lu=False)
        self.n2 = create_notification(self.user, titre="M2", lu=False)
        self.n3 = create_notification(self.user, titre="M3", lu=False)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_specific_ids_as_read(self):
        response = self.client.post(
            self.url, {"notification_ids": [self.n1.id, self.n2.id]}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.n1.refresh_from_db()
        self.n2.refresh_from_db()
        self.n3.refresh_from_db()
        self.assertTrue(self.n1.lu)
        self.assertTrue(self.n2.lu)
        self.assertFalse(self.n3.lu)  # non ciblée -> reste non lue

    def test_mark_all_as_read_when_ids_empty_list(self):
        response = self.client.post(self.url, {"notification_ids": []}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for n in [self.n1, self.n2, self.n3]:
            n.refresh_from_db()
            self.assertTrue(n.lu)

    def test_mark_all_as_read_when_body_empty(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for n in [self.n1, self.n2, self.n3]:
            n.refresh_from_db()
            self.assertTrue(n.lu)

    def test_response_contains_count(self):
        response = self.client.post(self.url, {"notification_ids": [self.n1.id]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertEqual(response.data["count"], 1)


# ---------------------------------------------------------------------------
# 5. NotificationCreateView
# ---------------------------------------------------------------------------

class NotificationCreateViewTest(APITestCase):
    """Tests pour POST notifications/creer/ (rôle ADMIN requis)."""

    def setUp(self):
        self.admin = create_user("admin_create@test.com", role="ADMIN")
        self.agent = create_user("agent_create@test.com", role="AGENT")
        self.proprietaire = create_user("proprio_create@test.com", role="PROPRIETAIRE")
        self.locataire = create_user("locataire_create@test.com", role="LOCATAIRE")
        self.url = reverse("notification-create")

        self.valid_payload = {
            "utilisateur": self.locataire.pk,
            "type": "AUTRE",
            "titre": "Nouvelle notification",
            "message": "Ceci est un message de test.",
        }

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_create_notification(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])

    def test_agent_cannot_create_notification(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_proprietaire_cannot_create_notification(self):
        self.client.force_authenticate(user=self.proprietaire)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_locataire_cannot_create_notification(self):
        self.client.force_authenticate(user=self.locataire)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_missing_message_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        payload = {k: v for k, v in self.valid_payload.items() if k != "message"}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_type_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        payload = {**self.valid_payload, "type": "TYPE_INEXISTANT"}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_utilisateur_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        payload = {**self.valid_payload, "utilisateur": 99999}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_create_all_valid_types(self):
        self.client.force_authenticate(user=self.admin)
        valid_types = [
            "CONTRAT_CREE", "PAIEMENT_VALIDE", "ECHEANCE_PROCHE",
            "PAIEMENT_EN_RETARD", "NOUVELLE_RESERVATION", "AUTRE",
        ]
        for notif_type in valid_types:
            payload = {**self.valid_payload, "type": notif_type, "titre": f"Test {notif_type}"}
            response = self.client.post(self.url, payload, format="json")
            self.assertEqual(
                response.status_code, status.HTTP_201_CREATED,
                msg=f"Création échouée pour le type {notif_type}",
            )


# ---------------------------------------------------------------------------
# 6. Notification Model
# ---------------------------------------------------------------------------

class NotificationModelTest(APITestCase):
    """Tests unitaires sur le modèle Notification."""

    def setUp(self):
        self.user = create_user("model_notif@test.com")

    def test_str_representation(self):
        notif = create_notification(self.user, type_notif="CONTRAT_CREE", titre="Contrat signé")
        str_repr = str(notif)
        self.assertIsInstance(str_repr, str)
        self.assertGreater(len(str_repr), 0)

    def test_default_lu_is_false(self):
        notif = Notification.objects.create(
            utilisateur=self.user, type="AUTRE", titre="Défaut", message="Message"
        )
        self.assertFalse(notif.lu)

    def test_default_email_envoye_is_false(self):
        notif = Notification.objects.create(
            utilisateur=self.user, type="AUTRE", titre="Défaut email", message="Message"
        )
        self.assertFalse(notif.email_envoye)

    def test_date_creation_auto_set(self):
        notif = create_notification(self.user)
        self.assertIsNotNone(notif.date_creation)

    def test_notification_with_lien(self):
        notif = Notification.objects.create(
            utilisateur=self.user, type="AUTRE", titre="Avec lien",
            message="Message", lien="/contracts/1/"
        )
        self.assertEqual(notif.lien, "/contracts/1/")

    def test_type_choices_display(self):
        notif = create_notification(self.user, type_notif="PAIEMENT_VALIDE")
        self.assertEqual(notif.get_type_display(), "Paiement validé")
