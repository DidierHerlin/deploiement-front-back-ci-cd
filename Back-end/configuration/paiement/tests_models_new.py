from django.test import TestCase
from paiement.models import Paiement, quittance_upload_path
from contrats.models import Contrat
from bien.models import Bien
from utilisateur.models import Utilisateur, Proprietaire, Locataire
from datetime import date

class PaiementNewModelTest(TestCase):
    def setUp(self):
        user_prop = Utilisateur.objects.create(email="prop_paie@test.com", role="PROPRIETAIRE")
        self.prop = Proprietaire.objects.create(user=user_prop)
        
        user_loc = Utilisateur.objects.create(email="loc_paie@test.com", role="LOCATAIRE")
        self.loc = Locataire.objects.create(user=user_loc)
        
        self.bien = Bien.objects.create(
            proprietaire=self.prop,
            titre="Bien Paie",
            type="MAISON",
            mode_transaction="LOCATION",
            adresse="1 rue paie",
            surface=100,
            nombre_pieces=4,
            loyer_mensuel=1000.0,
            statut="DISPONIBLE"
        )
        self.contrat = Contrat.objects.create(
            bien=self.bien,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.LOCATION,
            loyer=1000.0,
            depot_garantie=1000.0,
            date_debut=date(2026, 1, 1),
            date_fin=date(2026, 12, 31),
            statut=Contrat.StatutContrat.ACTIF
        )
        
    def test_quittance_upload_path(self):
        paiement = Paiement(
            contrat=self.contrat,
            date_echeance=date(2026, 2, 1),
            montant=1000.0
        )
        paiement.pk = 99
        path = quittance_upload_path(paiement, "test.pdf")
        self.assertEqual(path, f"quittances/contrat_{self.contrat.id}/paiement_99.pdf")
        
    def test_mois_echeance_and_message(self):
        paiement = Paiement(
            contrat=self.contrat,
            date_echeance=date(2026, 2, 1),
            montant=1000.0
        )
        self.assertEqual(paiement.mois_echeance, "février 2026")
        self.assertEqual(paiement.message_mois, "Ce paiement correspond au mois de février 2026.")
