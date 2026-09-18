from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Utilisateur, Locataire


class LocataireViewsTests(APITestCase):

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
        self.locataire = Locataire.objects.create(
            user=self.locataire_user, contact="0607080910"
        )
        
        self.locataire_user2 = Utilisateur.objects.create_user(
            email="locataire2@test.com", password="password123", role=Utilisateur.Role.LOCATAIRE, nom="Loc2", prenoms="Ataire2"
        )
        self.locataire2 = Locataire.objects.create(
            user=self.locataire_user2, contact="0607080911"
        )

        self.proprietaire = Utilisateur.objects.create_user(
            email="proprio@test.com", password="password123", role=Utilisateur.Role.PROPRIETAIRE, nom="Prop", prenoms="Ietaire"
        )

    def test_list_locataires_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('locataire-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['count'], 2)

    def test_list_locataires_as_locataire_forbidden(self):
        self.client.force_authenticate(user=self.locataire_user)
        url = reverse('locataire-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_locataire_me(self):
        self.client.force_authenticate(user=self.locataire_user)
        url = reverse('locataire-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['contact'], "0607080910")

    def test_get_locataire_detail_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('locataire-detail', kwargs={'pk': self.locataire.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['contact'], "0607080910")

    def test_get_locataire_detail_as_locataire_forbidden(self):
        self.client.force_authenticate(user=self.locataire_user)
        url = reverse('locataire-detail', kwargs={'pk': self.locataire2.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_put_locataire_me(self):
        self.client.force_authenticate(user=self.locataire_user)
        url = reverse('locataire-me')
        data = {"contact": "0699999999"}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.locataire.refresh_from_db()
        self.assertEqual(self.locataire.contact, "0699999999")

    def test_delete_locataire_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('locataire-detail', kwargs={'pk': self.locataire.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.locataire_user.refresh_from_db()
        self.assertFalse(self.locataire_user.is_active)
        with self.assertRaises(Locataire.DoesNotExist):
            self.locataire.refresh_from_db()
