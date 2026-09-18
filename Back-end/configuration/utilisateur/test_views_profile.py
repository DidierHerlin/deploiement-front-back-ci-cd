from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from utilisateur.models import Utilisateur

class ProfileViewsTests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(email="profile@t.com", password="pwd", role=Utilisateur.Role.AGENT)

    def test_get_profile(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('profil-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_profile(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('profil-modifier')
        response = self.client.put(url, {"nom": "NouveauNom"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.nom, "NouveauNom")

    def test_change_password(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('changer-mot-de-passe')
        data = {
            "current_password": "pwd",
            "new_password": "NewSecurePassword123!"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword123!"))

    def test_change_password_invalid(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('changer-mot-de-passe')
        data = {
            "current_password": "wrongpassword",
            "new_password": "NewSecurePassword123!"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
