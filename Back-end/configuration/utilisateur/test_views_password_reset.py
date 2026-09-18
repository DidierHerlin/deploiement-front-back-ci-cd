from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from utilisateur.models import Utilisateur
from datetime import timedelta
from django.utils import timezone
import secrets

class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(email="testreset@t.com", password="oldpassword")

    def test_request_reset_code(self):
        url = reverse('mdp-demande')
        response = self.client.post(url, {"email": "testreset@t.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.reset_token)

    def test_verify_code_valid(self):
        self.user.reset_token = "123456"
        self.user.reset_token_expiration = timezone.now() + timedelta(minutes=15)
        self.user.save()
        url = reverse('mdp-verifier-code')
        response = self.client.post(url, {"email": "testreset@t.com", "code": "123456"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_code_invalid(self):
        self.user.reset_token = "123456"
        self.user.reset_token_expiration = timezone.now() + timedelta(minutes=15)
        self.user.save()
        url = reverse('mdp-verifier-code')
        response = self.client.post(url, {"email": "testreset@t.com", "code": "654321"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_reset(self):
        self.user.reset_token = "123456"
        self.user.reset_token_expiration = timezone.now() + timedelta(minutes=15)
        self.user.save()
        url = reverse('mdp-reinitialiser')
        response = self.client.post(url, {
            "email": "testreset@t.com", 
            "code": "123456", 
            "new_password": "NewSecurePassword123!"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword123!"))
        self.assertIsNone(self.user.reset_token)
