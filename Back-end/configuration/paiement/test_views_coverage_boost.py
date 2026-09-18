from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from notifications.models import Notification

class AdditionalViewsCoverageTests(APITestCase):
    def setUp(self):
        # Setup data for Paiements and Notifications
        self.admin = Utilisateur.objects.create_superuser(email="admin_cov@test.com", password="pwd", nom="Admin", prenoms="A")
        self.locataire_user = Utilisateur.objects.create_user(email="loc_cov@test.com", password="pwd", nom="L", prenoms="L", role=Utilisateur.Role.LOCATAIRE)
        self.proprietaire_user = Utilisateur.objects.create_user(email="prop_cov@test.com", password="pwd", nom="P", prenoms="P", role=Utilisateur.Role.PROPRIETAIRE)
        
        # Obtenir ou créer profils
        self.prop = getattr(self.proprietaire_user, 'profil_proprietaire', None) or Proprietaire.objects.create(user=self.proprietaire_user)
        self.loc = getattr(self.locataire_user, 'profil_locataire', None) or Locataire.objects.create(user=self.locataire_user)
        
        self.bien = Bien.objects.create(proprietaire=self.prop, titre="Bien test", type="APPARTEMENT", mode_transaction="LOCATION", surface=10, nombre_pieces=1, loyer_mensuel=100, adresse="Test")
        self.contrat = Contrat.objects.create(bien=self.bien, locataire=self.loc, type_contrat="LOCATION", loyer=100, depot_garantie=100, date_debut=timezone.now().date(), date_fin=timezone.now().date() + timezone.timedelta(days=365))
        
        # Création de notifications
        self.notif1 = Notification.objects.create(utilisateur=self.locataire_user, titre="Test Notif", message="Hello", type=Notification.Type.AUTRE)
        
    def test_notifications_endpoints(self):
        self.client.force_authenticate(user=self.locataire_user)
        # List
        resp = self.client.get('/api/notifications/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Non lues
        resp = self.client.get('/api/notifications/non_lues/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Tout marquer lu
        resp = self.client.post('/api/notifications/tout_marquer_lu/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Marquer lu spécifique
        resp = self.client.post(f'/api/notifications/{self.notif1.id}/marquer_lu/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Delete
        resp = self.client.delete(f'/api/notifications/{self.notif1.id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_paiements_endpoints(self):
        self.client.force_authenticate(user=self.admin)
        
        # Ensure a paiement exists
        paiement = Paiement.objects.filter(contrat=self.contrat).first()
        if not paiement:
            paiement = Paiement.objects.create(contrat=self.contrat, num_echeance=1, date_echeance=timezone.now().date(), montant_attendu=100, montant=100)
        
        # List
        resp = self.client.get('/api/paiements/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        
        # Valider
        resp = self.client.post(f'/api/paiements/{paiement.id}/valider/', {"mode_paiement": "ESPECES"})
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]) # Could be already validated
        
        # Annuler
        resp = self.client.post(f'/api/paiements/{paiement.id}/annuler/')
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_paiements_locataire_access(self):
        self.client.force_authenticate(user=self.locataire_user)
        resp = self.client.get('/api/paiements/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
