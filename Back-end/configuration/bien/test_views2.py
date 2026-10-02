from rest_framework.test import APITestCase
from rest_framework import status
from utilisateur.models import Utilisateur
from bien.models import Bien
from django.urls import reverse

class BienViewsTests(APITestCase):
    def setUp(self):
        self.admin = Utilisateur.objects.create_superuser(
            email='admin@test.com',
            password='testpassword123',
            nom='Admin'
        )
        self.proprio_user = Utilisateur.objects.create_user(
            email='proprio@test.com',
            password='testpassword123',
            nom='Proprio',
            role=Utilisateur.Role.PROPRIETAIRE
        )
        self.locataire_user = Utilisateur.objects.create_user(
            email='locataire@test.com',
            password='testpassword123',
            nom='Locataire',
            role=Utilisateur.Role.LOCATAIRE
        )
        self.bien = Bien.objects.create(
            proprietaire=(getattr(self.proprio_user, 'profil_proprietaire', None) or __import__('utilisateur.models', fromlist=['Proprietaire']).Proprietaire.objects.create(user=self.proprio_user, iban="MG123")),
            titre="Appart test",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION,
            adresse="1 rue test",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=1000,
            statut=Bien.StatutBien.DISPONIBLE
        )

    def test_list_biens_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/biens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_biens_proprio(self):
        self.client.force_authenticate(user=self.proprio_user)
        response = self.client.get('/api/biens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_biens_locataire(self):
        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get('/api/biens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_bien_admin(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "proprietaire_id": (getattr(self.proprio_user, 'profil_proprietaire', None) or __import__('utilisateur.models', fromlist=['Proprietaire']).Proprietaire.objects.create(user=self.proprio_user, iban="MG123")).id,
            "titre": "Nouveau bien",
            "type": Bien.TypeBien.MAISON,
            "mode_transaction": Bien.ModeTransaction.VENTE,
            "adresse": "123 test",
            "surface": 100,
            "nombre_pieces": 4,
            "prix": 200000
        }
        response = self.client.post('/api/biens/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_disponibles(self):
        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get('/api/biens/disponible/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_retrieve_bien(self):
        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get(f'/api/biens/{self.bien.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_bien(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/biens/{self.bien.id}/', {"titre": "Updated"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_bien(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/biens/{self.bien.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_list_biens_filtering(self):
        self.client.force_authenticate(user=self.admin)
        # Create a second bien with different properties
        Bien.objects.create(
            proprietaire=self.bien.proprietaire,
            titre="Maison Vente",
            type=Bien.TypeBien.MAISON,
            mode_transaction=Bien.ModeTransaction.VENTE,
            adresse="Test",
            surface=100,
            nombre_pieces=4,
            prix=100000,
            statut=Bien.StatutBien.DISPONIBLE
        )
        response = self.client.get('/api/biens/?type=MAISON&mode_transaction=VENTE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['titre'], "Maison Vente")

    def test_disponibles_filtering(self):
        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get('/api/biens/disponible/?statut=DISPONIBLE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertTrue(response.data['success'])
