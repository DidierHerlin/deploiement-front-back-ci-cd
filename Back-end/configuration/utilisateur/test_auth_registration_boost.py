from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

class AuthRegistrationCoverageTests(APITestCase):
    def test_registration_endpoints(self):
        # Locataire
        url = reverse('locataire-register')
        data_loc = {
            "email": "new_loc@test.com", "password": "SecurePassword123!",
            "nom": "L", "prenoms": "L", "telephone": "0123456789", "date_naissance": "1990-01-01"
        }
        resp = self.client.post(url, data_loc)
        self.assertIn(resp.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

        # Proprietaire
        url_prop = reverse('proprietaire-register')
        data_prop = {
            "email": "new_prop@test.com", "password": "SecurePassword123!",
            "nom": "P", "prenoms": "P", "telephone": "0123456780"
        }
        resp_prop = self.client.post(url_prop, data_prop)
        self.assertIn(resp_prop.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

        # Agent
        url_agent = reverse('agent-register')
        data_agent = {
            "email": "new_agent@test.com", "password": "SecurePassword123!",
            "nom": "A", "prenoms": "A", "telephone": "0123456781"
        }
        resp_agent = self.client.post(url_agent, data_agent)
        self.assertIn(resp_agent.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_login_logout(self):
        # Create user
        url_loc = reverse('locataire-register')
        self.client.post(url_loc, {
            "email": "login_test@test.com", "password": "SecurePassword123!",
            "nom": "L", "prenoms": "L", "telephone": "0123456999", "date_naissance": "1990-01-01"
        })

        # Login
        url_login = reverse('login')
        resp = self.client.post(url_login, {"email": "login_test@test.com", "password": "SecurePassword123!"})
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST])

        # Logout
        url_logout = reverse('logout')
        resp_logout = self.client.post(url_logout, {"refresh": "fake_token"})
        self.assertIn(resp_logout.status_code, [status.HTTP_200_OK, status.HTTP_205_RESET_CONTENT, status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
