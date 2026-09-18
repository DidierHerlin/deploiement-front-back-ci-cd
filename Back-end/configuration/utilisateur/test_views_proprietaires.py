from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Utilisateur, Proprietaire


class ProprietaireViewsTests(APITestCase):

    def setUp(self):
        # Create different users for testing
        self.admin = Utilisateur.objects.create_user(
            email="admin@test.com", password="password123", role=Utilisateur.Role.ADMIN, nom="Admin", prenoms="Test"
        )
        self.agent = Utilisateur.objects.create_user(
            email="agent@test.com", password="password123", role=Utilisateur.Role.AGENT, nom="Agent", prenoms="Test"
        )
        
        self.proprietaire_user = Utilisateur.objects.create_user(
            email="proprio@test.com", password="password123", role=Utilisateur.Role.PROPRIETAIRE, nom="Prop", prenoms="Ietaire"
        )
        self.proprietaire = Proprietaire.objects.create(
            user=self.proprietaire_user, iban="FR1234567890", contact="0102030405"
        )
        
        self.proprietaire_user2 = Utilisateur.objects.create_user(
            email="proprio2@test.com", password="password123", role=Utilisateur.Role.PROPRIETAIRE, nom="Prop2", prenoms="Ietaire2"
        )
        self.proprietaire2 = Proprietaire.objects.create(
            user=self.proprietaire_user2, iban="FR0987654321", contact="0504030201"
        )

        self.locataire = Utilisateur.objects.create_user(
            email="locataire@test.com", password="password123", role=Utilisateur.Role.LOCATAIRE, nom="Loc", prenoms="Ataire"
        )

    def test_list_proprietaires_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('proprietaire-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should have 2 owners
        self.assertEqual(response.data['count'], 2)

    def test_list_proprietaires_as_proprietaire_forbidden(self):
        self.client.force_authenticate(user=self.proprietaire_user)
        url = reverse('proprietaire-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_proprietaire_me(self):
        self.client.force_authenticate(user=self.proprietaire_user)
        url = reverse('proprietaire-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['iban'], "FR1234567890")

    def test_get_proprietaire_detail_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('proprietaire-detail', kwargs={'pk': self.proprietaire.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['iban'], "FR1234567890")

    def test_get_proprietaire_detail_as_proprietaire_forbidden(self):
        self.client.force_authenticate(user=self.proprietaire_user)
        # Try to access another proprietaire's detail
        url = reverse('proprietaire-detail', kwargs={'pk': self.proprietaire2.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_put_proprietaire_me(self):
        self.client.force_authenticate(user=self.proprietaire_user)
        url = reverse('proprietaire-me')
        data = {"iban": "FR_NEW_IBAN", "contact": "0909090909"}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.proprietaire.refresh_from_db()
        self.assertEqual(self.proprietaire.iban, "FR_NEW_IBAN")

    def test_delete_proprietaire_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('proprietaire-detail', kwargs={'pk': self.proprietaire.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.proprietaire_user.refresh_from_db()
        self.assertFalse(self.proprietaire_user.is_active)
        with self.assertRaises(Proprietaire.DoesNotExist):
            self.proprietaire.refresh_from_db()

    def test_activer_compte(self):
        # Desactivate an account to test activation
        self.proprietaire_user.is_active = False
        self.proprietaire_user.save()

        self.client.force_authenticate(user=self.admin)
        url = reverse('activer-compte', kwargs={'pk': self.proprietaire_user.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.proprietaire_user.refresh_from_db()
        self.assertTrue(self.proprietaire_user.is_active)
