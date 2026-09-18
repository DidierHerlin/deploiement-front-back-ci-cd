from rest_framework.test import APITestCase
from rest_framework import status
from utilisateur.models import Utilisateur
from paiement.models import Paiement
from contrats.models import Contrat
from bien.models import Bien

class PaiementActionViewsTests(APITestCase):
    def setUp(self):
        self.admin = Utilisateur.objects.create_superuser(email="admin_paie@test.com", password="pwd", nom="Admin", prenoms="A")
        
        # We need a Locataire and Proprietaire, but we can bypass constraints by just using the admin for now if we can
        # To make it simple, let's just create a Paiement by bypassing constraints or using fake objects
        # Actually, let's use the API with a mock or directly create them
        pass

    def test_impayes_as_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/paiements/impayes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_quittance_not_found(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/paiements/999/quittance/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
