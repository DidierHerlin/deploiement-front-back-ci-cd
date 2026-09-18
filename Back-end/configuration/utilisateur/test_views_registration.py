from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from utilisateur.models import Utilisateur, Locataire, Proprietaire

class RegistrationViewsTests(APITestCase):
    def test_register_locataire_valid(self):
        url = reverse('locataire-register')
        data = {
            "email": "newloc@test.com",
            "password": "Password123!",
            "nom": "Doe",
            "prenoms": "John",
            "contact": "0606060606"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Utilisateur.objects.filter(email="newloc@test.com").exists())
        self.assertTrue(Locataire.objects.filter(user__email="newloc@test.com").exists())

    def test_register_locataire_invalid(self):
        url = reverse('locataire-register')
        data = {
            "email": "invalid"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_proprietaire_valid(self):
        url = reverse('proprietaire-register')
        data = {
            "email": "newprop@test.com",
            "password": "Password123!",
            "nom": "Prop",
            "prenoms": "Rietaire",
            "iban": "FR12345",
            "contact": "0707070707"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Utilisateur.objects.filter(email="newprop@test.com").exists())
        self.assertTrue(Proprietaire.objects.filter(user__email="newprop@test.com").exists())

    def test_register_proprietaire_invalid(self):
        url = reverse('proprietaire-register')
        data = {"email": "invalid"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_agent_valid(self):
        url = reverse('agent-register')
        data = {
            "email": "newagent@test.com",
            "password": "Password123!",
            "nom": "Agent",
            "prenoms": "Immo"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        u = Utilisateur.objects.get(email="newagent@test.com")
        self.assertEqual(u.role, Utilisateur.Role.AGENT)

    def test_register_agent_invalid(self):
        url = reverse('agent-register')
        data = {"email": "notanemail"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
