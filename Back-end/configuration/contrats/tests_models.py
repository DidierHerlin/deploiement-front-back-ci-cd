from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from datetime import timedelta

class ContratModelTests(TestCase):
    def setUp(self):
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
            proprietaire=(getattr(self.proprio_user, 'profil_proprietaire', None) or __import__('utilisateur.models', fromlist=['Proprietaire']).Proprietaire.objects.create(user=self.proprio_user)),
            titre="Appart test",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION,
            adresse="1 rue test",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=1000
        )
        self.bien_vente = Bien.objects.create(
            proprietaire=(getattr(self.proprio_user, 'profil_proprietaire', None) or __import__('utilisateur.models', fromlist=['Proprietaire']).Proprietaire.objects.create(user=self.proprio_user)),
            titre="Appart test vente",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.VENTE,
            adresse="1 rue test",
            surface=50,
            nombre_pieces=2,
            prix=100000
        )

    def test_contrat_location_creation(self):
        contrat = Contrat(
            bien=self.bien,
            locataire=(getattr(self.locataire_user, 'profil_locataire', None) or __import__('utilisateur.models', fromlist=['Locataire']).Locataire.objects.create(user=self.locataire_user)),
            type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=timezone.now().date(),
            date_fin=timezone.now().date() + timedelta(days=365),
            loyer=1000,
            depot_garantie=2000
        )
        contrat.full_clean()
        contrat.save()
        self.assertEqual(contrat.statut, Contrat.StatutContrat.ACTIF)
        
        contrat.resilier()
        self.assertEqual(contrat.statut, Contrat.StatutContrat.RESILIE)
        
        # Test get_echeances_a_venir
        echeances = contrat.get_echeances_a_venir()
        self.assertIsInstance(echeances, list)

    def test_contrat_achat_creation(self):
        contrat = Contrat(
            bien=self.bien_vente,
            locataire=(getattr(self.locataire_user, 'profil_locataire', None) or __import__('utilisateur.models', fromlist=['Locataire']).Locataire.objects.create(user=self.locataire_user)), # Locataire model represents client here
            type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE,
            prix=100000
        )
        contrat.full_clean()
        contrat.save()
        
        contrat.finaliser_vente()
        self.assertEqual(contrat.statut, Contrat.StatutContrat.VENDU)
