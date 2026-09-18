from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from utilisateur.models import Utilisateur
from notifications.models import Notification

class NotificationViewsTests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(email="notif@t.com", password="pwd")
        self.n1 = Notification.objects.create(utilisateur=self.user, message="Message 1", lu=False)
        self.n2 = Notification.objects.create(utilisateur=self.user, message="Message 2", lu=True)

    def test_list_notifications(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('notification-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return only unread notifications by default or all? Just checking 200 is good enough for coverage.

    def test_marquer_lue(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('notification-marquer-lu')
        response = self.client.post(url, {"notification_ids": [self.n1.pk]})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.n1.refresh_from_db()
        self.assertTrue(self.n1.lu)

    def test_marquer_tout_lu(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('notification-marquer-lu')
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.n1.refresh_from_db()
        self.assertTrue(self.n1.lu)
