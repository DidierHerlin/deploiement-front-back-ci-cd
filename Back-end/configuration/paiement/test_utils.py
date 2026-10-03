from django.test import TestCase
from decimal import Decimal
from django.utils import timezone
from utilisateur.models import Utilisateur, Proprietaire, Locataire
from contrats.models import Contrat
from bien.models import Bien
from paiement.models import Paiement
from paiement.utils import generate_quittance_pdf, formater_montant_ar

class PaiementUtilsTest(TestCase):
    def setUp(self):
        self.prop_user = Utilisateur.objects.create_user(email="prop@test.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.loc_user = Utilisateur.objects.create_user(email="loc@test.com", password="pwd", role=Utilisateur.Role.LOCATAIRE)
        
        self.proprietaire = Proprietaire.objects.create(user=self.prop_user)
        self.locataire = Locataire.objects.create(user=self.loc_user)
        
        self.bien = Bien.objects.create(
            titre="Appartement Test",
            proprietaire=self.proprietaire,
            type=Bien.TypeBien.TERRAIN,
            statut=Bien.StatutBien.DISPONIBLE,
            loyer_mensuel=Decimal("500000.00"),
            adresse="123 test",
            surface=50
        )
        
        self.contrat = Contrat.objects.create(
            bien=self.bien,
            locataire=self.locataire,
            type_contrat=Contrat.TypeContrat.LOCATION,
            loyer=Decimal("500000.00"),
            depot_garantie=Decimal("250000.00"),
            date_debut=timezone.now().date(),
            date_fin=timezone.now().date() + timezone.timedelta(days=365),
            statut="ACTIF"
        )
        
        # Le backend génère probablement automatiquement les paiements via signaux
        # On va donc récupérer les paiements existants au lieu de les créer
        paiements = list(Paiement.objects.filter(contrat=self.contrat).order_by('date_echeance'))
        
        if len(paiements) < 2:
            # S'ils ne sont pas auto-générés, on les crée avec des dates différentes
            self.paiement_1 = Paiement.objects.create(
                contrat=self.contrat, montant=Decimal("500000.00"), montant_paye=Decimal("500000.00"),
                statut=Paiement.StatutPaiement.PAYE, date_echeance=timezone.now().date() + timezone.timedelta(days=1)
            )
            self.paiement_2 = Paiement.objects.create(
                contrat=self.contrat, montant=Decimal("500000.00"), montant_paye=Decimal("500000.00"),
                statut=Paiement.StatutPaiement.PAYE, date_echeance=timezone.now().date() + timezone.timedelta(days=32)
            )
        else:
            self.paiement_1 = paiements[0]
            self.paiement_1.montant_paye = Decimal("500000.00")
            self.paiement_1.statut = Paiement.StatutPaiement.PAYE
            self.paiement_1.save()
            
            self.paiement_2 = paiements[1]
            self.paiement_2.montant_paye = Decimal("500000.00")
            self.paiement_2.statut = Paiement.StatutPaiement.PAYE
            self.paiement_2.save()

    def test_formater_montant_ar(self):
        self.assertEqual(formater_montant_ar(None), "0")
        self.assertEqual(formater_montant_ar(500000), "500 000")
        
    def test_generate_quittance_premier_paiement(self):
        file_name = generate_quittance_pdf(self.paiement_1)
        self.assertTrue(self.paiement_1.fichier_quittance.name.endswith(".pdf"))
        
    def test_generate_quittance_deuxieme_paiement(self):
        file_name = generate_quittance_pdf(self.paiement_2)
        self.assertTrue(self.paiement_2.fichier_quittance.name.endswith(".pdf"))
