from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from datetime import date
from utilisateur.models import Utilisateur, Proprietaire, Locataire
from bien.models import Bien
from contrats.models import Contrat

class ContratModelTests(TestCase):
    def setUp(self):
        self.u1 = Utilisateur.objects.create_user(email="p@t.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.u1)
        self.u2 = Utilisateur.objects.create_user(email="l@t.com", password="pwd", role=Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.u2)

        self.bien_loc = Bien.objects.create(
            proprietaire=self.prop, titre="A", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=50,
            nombre_pieces=2, loyer_mensuel=1000, statut=Bien.StatutBien.DISPONIBLE
        )
        self.bien_vente = Bien.objects.create(
            proprietaire=self.prop, titre="B", type=Bien.TypeBien.MAISON,
            mode_transaction=Bien.ModeTransaction.VENTE, adresse="Test", surface=100,
            nombre_pieces=4, prix=200000, statut=Bien.StatutBien.DISPONIBLE
        )

    def test_creation_contrat_location_valide(self):
        c = Contrat(
            bien=self.bien_loc,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date(2025, 1, 1),
            date_fin=date(2025, 12, 31),
            loyer=1000,
            depot_garantie=1000
        )
        c.save()
        self.assertEqual(c.statut, Contrat.StatutContrat.ACTIF)
        self.assertTrue(c.est_actif)
        self.assertEqual(c.date_paiement, date(2025, 2, 1))

        # Tester echeances
        echeances = c.get_echeances_a_venir(date_reference=date(2025, 1, 30))
        self.assertEqual(len(echeances), 1)

    def test_creation_contrat_location_invalide(self):
        # Manque date_debut
        c = Contrat(
            bien=self.bien_loc, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            loyer=1000, depot_garantie=1000
        )
        with self.assertRaises(ValidationError):
            c.full_clean()

    def test_creation_contrat_achat_valide(self):
        c = Contrat(
            bien=self.bien_vente,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE,
            prix=200000
        )
        c.save()
        self.assertEqual(c.statut, Contrat.StatutContrat.ACTIF)

    def test_creation_contrat_achat_invalide(self):
        # Bien est en location, on essaie de l'acheter
        c = Contrat(
            bien=self.bien_loc,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE,
            prix=200000
        )
        with self.assertRaises(ValidationError):
            c.full_clean()

    def test_transitions_statut_location(self):
        c = Contrat.objects.create(
            bien=self.bien_loc, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date(2025, 1, 1), date_fin=date(2025, 12, 31), loyer=1000, depot_garantie=1000
        )
        c.resilier()
        self.assertEqual(c.statut, Contrat.StatutContrat.RESILIE)
        
        with self.assertRaises(ValidationError):
            c.statut = Contrat.StatutContrat.TERMINE
            c.save()

    def test_transitions_statut_vente(self):
        c = Contrat.objects.create(
            bien=self.bien_vente, locataire=self.loc, type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE, prix=200000
        )
        c.finaliser_vente()
        self.assertEqual(c.statut, Contrat.StatutContrat.VENDU)
