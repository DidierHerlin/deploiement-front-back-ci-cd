from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from datetime import date
from utilisateur.models import Utilisateur, Proprietaire, Locataire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement, quittance_upload_path

class PaiementModelTests(TestCase):
    def setUp(self):
        self.u1 = Utilisateur.objects.create_user(email="p@t.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.u1)
        self.u2 = Utilisateur.objects.create_user(email="l@t.com", password="pwd", nom="Doe", prenoms="John", role=Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.u2)

        self.bien_loc = Bien.objects.create(
            proprietaire=self.prop, titre="A", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=50,
            nombre_pieces=2, loyer_mensuel=1000, statut=Bien.StatutBien.DISPONIBLE
        )
        future_date = timezone.now().date() + relativedelta(months=1)
        future_end = timezone.now().date() + relativedelta(months=12)
        self.contrat = Contrat.objects.create(
            bien=self.bien_loc, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=future_date, date_fin=future_end, loyer=1000, depot_garantie=1000
        )
        Paiement.objects.all().delete()  # Clear auto-generated payments to avoid conflicts

    def test_creation_paiement_valide(self):
        future_date = timezone.now().date() + relativedelta(months=2)
        p = Paiement(
            contrat=self.contrat,
            date_echeance=future_date,
            montant=1000,
            montant_attendu=1000,
            montant_paye=0
        )
        p.save()
        self.assertEqual(p.statut, Paiement.StatutPaiement.EN_ATTENTE)
        self.assertEqual(p.locataire, self.loc)
        self.assertEqual(p.nom_locataire, "John Doe")
        self.assertEqual(p.montant_restant, 1000)
        self.assertTrue(isinstance(p.message_mois, str))
        self.assertTrue(isinstance(p.mois_echeance, str))
        self.assertEqual(str(p), f"Paiement #{p.pk} \u2014 A (En attente)")

    def test_mobile_money_reference_obligatoire(self):
        p = Paiement(
            contrat=self.contrat,
            date_echeance=date(2025, 2, 1),
            montant=1000,
            mode_paiement=Paiement.ModePaiement.MVOLA,
            reference=""
        )
        with self.assertRaises(ValidationError) as ctx:
            p.full_clean()
        self.assertIn("reference", ctx.exception.message_dict)

    def test_validation_et_annulation(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2025, 2, 1),
            montant=1000,
            montant_attendu=1000
        )
        p.valider_paiement()
        self.assertEqual(p.statut, Paiement.StatutPaiement.PAYE)
        self.assertIsNotNone(p.date_paiement)

        with self.assertRaises(ValueError):
            p.valider_paiement() # Deja valide
            
        with self.assertRaises(ValueError):
            p.annuler_paiement() # Deja valide ne peut etre annule
            
    def test_annuler_paiement(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2025, 2, 1),
            montant=1000,
            montant_attendu=1000
        )
        p.annuler_paiement()
        self.assertEqual(p.statut, Paiement.StatutPaiement.ANNULE)

    def test_est_en_retard(self):
        # En attente, mais date echeance dans le passe lointain
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2000, 1, 1),
            montant=1000
        )
        self.assertTrue(p.est_en_retard)

    def test_quittance_upload_path(self):
        p = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance=date(2025, 2, 1),
            montant=1000
        )
        path = quittance_upload_path(p, "test.pdf")
        self.assertEqual(path, f"quittances/contrat_{self.contrat.id}/paiement_{p.pk}.pdf")
