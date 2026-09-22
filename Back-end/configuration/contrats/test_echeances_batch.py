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
            date_fin=self.date_debut + relativedelta(years=1),
            loyer=1000,
            depot_garantie=1000,
            statut="ACTIF"
        )

    def test_get_echeances_a_venir_with_batch(self):
        # Update the generated paiement to PAYE
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
                montant_attendu=1000,
                statut="PAYE",
                montant_paye=1000
            )
        
        # Test without passing batch (should fallback to querying)
        echeances = self.contrat.get_echeances_a_venir(date_reference=echeance_1)
        self.assertEqual(len(echeances), 1) # Returns the next unpaid (echeance_2)
        
        # Test with batch
        batch = {echeance_1}
        echeances_batch = self.contrat.get_echeances_a_venir(date_reference=echeance_1, paiements_payes=batch)
        self.assertEqual(len(echeances_batch), 1)

        # Move reference date forward
        echeance_2 = self.date_debut + relativedelta(months=2)
        echeances_unpaid = self.contrat.get_echeances_a_venir(date_reference=echeance_2, paiements_payes=batch)
        self.assertEqual(len(echeances_unpaid), 1)
        self.assertEqual(echeances_unpaid[0]['date_echeance'], echeance_2)

