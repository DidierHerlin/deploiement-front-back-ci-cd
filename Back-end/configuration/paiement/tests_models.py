from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from utilisateur.models import Utilisateur
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from datetime import timedelta
from unittest.mock import patch

class PaiementModelTests(TestCase):
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
        self.contrat = Contrat.objects.create(
            bien=self.bien,
            locataire=(getattr(self.locataire_user, 'profil_locataire', None) or __import__('utilisateur.models', fromlist=['Locataire']).Locataire.objects.create(user=self.locataire_user)),
            type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=timezone.now().date(),
            date_fin=timezone.now().date() + timedelta(days=365),
            date_paiement=5,
            loyer=1000,
            depot_garantie=2000
        )

    def test_paiement_creation(self):
        Paiement.objects.filter(contrat=self.contrat).delete()
        paiement = Paiement(
            contrat=self.contrat,
            num_echeance=1,
            date_echeance=timezone.now().date(),
            montant_attendu=1000,
            montant=1000,
            mode_paiement=Paiement.ModePaiement.VIREMENT
        )
        paiement.full_clean()
        paiement.save()
        
        self.assertEqual(paiement.statut, Paiement.StatutPaiement.EN_ATTENTE)
        
        paiement.valider_paiement()
        self.assertEqual(paiement.statut, Paiement.StatutPaiement.PAYE)
        # Annulation
        paiement.statut = Paiement.StatutPaiement.EN_ATTENTE
        paiement.save()
        paiement.annuler_paiement()
        self.assertEqual(paiement.statut, Paiement.StatutPaiement.ANNULE)

    def test_paiement_retard(self):
        Paiement.objects.filter(contrat=self.contrat).delete()
        paiement = Paiement(
            contrat=self.contrat,
            num_echeance=2,
            date_echeance=timezone.now().date() - timedelta(days=10),
            montant_attendu=1000,
            montant=1000
        )
        paiement.save()
        self.assertTrue(paiement.est_en_retard)
