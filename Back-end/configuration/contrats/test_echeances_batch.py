from django.test import TestCase
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement

class EcheancesBatchTests(TestCase):
    def setUp(self):
        self.proprio_user = Utilisateur.objects.create_user(email='p@test.com', password='pwd', role=Utilisateur.Role.PROPRIETAIRE)
        self.proprio = Proprietaire.objects.create(user=self.proprio_user)
        self.loc_user = Utilisateur.objects.create_user(email='l@test.com', password='pwd', role=Utilisateur.Role.LOCATAIRE)
        self.locataire = Locataire.objects.create(user=self.loc_user)

        self.bien = Bien.objects.create(
            proprietaire=self.proprio,
            titre="Bien test",
            type="APPARTEMENT",
            mode_transaction="LOCATION",
            adresse="Paris",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=1000,
            statut="DISPONIBLE"
        )
        self.date_debut = timezone.now().date() - relativedelta(months=1)
        self.contrat = Contrat.objects.create(
            bien=self.bien,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=self.date_debut,
            date_fin=self.date_debut + relativedelta(months=2),
            loyer=1000,
            depot_garantie=1000,
            statut="ACTIF"
        )

    def test_get_echeances_a_venir_with_batch(self):
        echeance_1 = self.date_debut + relativedelta(months=1)
        paiement = Paiement.objects.filter(contrat=self.contrat, date_echeance=echeance_1).first()
        if paiement:
            paiement.statut = "PAYE"
            paiement.montant_paye = 1000
            paiement.save(update_fields=["statut", "montant_paye"])
        else:
            Paiement.objects.create(
                contrat=self.contrat,
                date_echeance=echeance_1,
                montant=1000,
                montant_attendu=1000,
                statut="PAYE",
                montant_paye=1000
            )
        
        # Test without passing batch
        echeances = self.contrat.get_echeances_a_venir(date_reference=echeance_1)
        self.assertEqual(len(echeances), 1)
        
        # Test with batch
        batch = {echeance_1}
        echeances_batch = self.contrat.get_echeances_a_venir(date_reference=echeance_1, paiements_payes=batch)
        self.assertEqual(len(echeances_batch), 1)

    def test_get_echeances_a_venir_all_paid(self):
        echeance_1 = self.date_debut + relativedelta(months=1)
        echeance_2 = self.date_debut + relativedelta(months=2)
        
        Paiement.objects.update_or_create(
            contrat=self.contrat, date_echeance=echeance_1,
            defaults={'statut': 'PAYE', 'montant': 1000, 'montant_paye': 1000, 'montant_attendu': 1000}
        )
        Paiement.objects.update_or_create(
            contrat=self.contrat, date_echeance=echeance_2,
            defaults={'statut': 'PAYE', 'montant': 1000, 'montant_paye': 1000, 'montant_attendu': 1000}
        )
        
        # Test without date_reference and no unpaid echeances
        echeances = self.contrat.get_echeances_a_venir()
        self.assertEqual(len(echeances), 0)

    def test_get_echeances_a_venir_invalid_status_or_type(self):
        self.contrat.statut = "RESILIE"
        self.contrat.save()
        echeances = self.contrat.get_echeances_a_venir()
        self.assertEqual(len(echeances), 0)
        
        # Create a new non-location contrat
        contrat_vente = Contrat.objects.create(
            bien=self.bien,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=self.date_debut,
            date_fin=self.date_debut + relativedelta(months=2),
            loyer=1000,
            depot_garantie=1000,
            statut="ACTIF"
        )
        # Mock it to test branch
        contrat_vente.type_contrat = "BAIL_COMMERCIAL"
        echeances_vente = contrat_vente.get_echeances_a_venir()
        self.assertEqual(len(echeances_vente), 0)
