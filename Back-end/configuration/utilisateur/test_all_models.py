"""
Test générique pour les modèles afin d'augmenter la couverture des méthodes de base (str, clean, save).
"""
from django.test import TestCase
from django.utils import timezone
from datetime import date
from dateutil.relativedelta import relativedelta

from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from reservation.models import Reservation
from notifications.models import Notification

class AllModelsCoverageTest(TestCase):

    def setUp(self):
        # Utilisateur
        self.u_admin = Utilisateur.objects.create_user(email="m.admin@m.com", password="pwd", role=Utilisateur.Role.ADMIN)
        self.u_prop = Utilisateur.objects.create_user(email="m.prop@m.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.u_prop, iban="MG123")
        
        self.u_loc = Utilisateur.objects.create_user(email="m.loc@m.com", password="pwd", role=Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.u_loc)

        # Bien
        self.bien = Bien.objects.create(
            proprietaire=self.prop, titre="Super Bien", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=100, nombre_pieces=3,
            loyer_mensuel=500000, statut=Bien.StatutBien.DISPONIBLE
        )
        
        self.bien_vente = Bien.objects.create(
            proprietaire=self.prop, titre="Super Bien Vente", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.VENTE, adresse="Test", surface=100, nombre_pieces=3,
            prix=10000000, statut=Bien.StatutBien.DISPONIBLE
        )

        # Contrat
        self.contrat = Contrat.objects.create(
            bien=self.bien, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date.today(), date_fin=date.today() + relativedelta(months=12),
            loyer=500000, depot_garantie=500000
        )
        self.contrat_achat = Contrat.objects.create(
            bien=self.bien_vente, locataire=self.loc, type_contrat=Contrat.TypeContrat.ACHAT,
            prix=10000000, type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE
        )

        # Paiement
        self.paiement = Paiement.objects.create(
            contrat=self.contrat, date_echeance=date.today() + relativedelta(months=10),
            montant=500000, montant_attendu=500000
        )

        self.bien_resa = Bien.objects.create(
            proprietaire=self.prop, titre="Bien Resa", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=100, nombre_pieces=3,
            loyer_mensuel=500000, statut=Bien.StatutBien.DISPONIBLE
        )
        # Reservation
        self.reservation = Reservation.objects.create(
            bien=self.bien_resa, locataire=self.loc, type_reservation=Reservation.TypeReservation.LOCATION
        )

        # Notification
        self.notif = Notification.objects.create(
            utilisateur=self.u_loc, type=Notification.Type.AUTRE, message="Hello"
        )

    def test_str_methods(self):
        self.assertTrue(isinstance(str(self.u_admin), str))
        self.assertTrue(isinstance(str(self.prop), str))
        self.assertTrue(isinstance(str(self.loc), str))
        self.assertTrue(isinstance(str(self.bien), str))

        self.assertTrue(isinstance(str(self.contrat), str))
        self.assertTrue(isinstance(str(self.paiement), str))
        self.assertTrue(isinstance(str(self.reservation), str))
        self.assertTrue(isinstance(str(self.notif), str))

    def test_clean_methods(self):
        self.bien.clean()
        self.contrat.clean()
        self.contrat_achat.clean()
        self.paiement.clean()
        self.reservation.clean()
        self.notif.clean()

    def test_model_properties_coverage(self):
        # Contrat properties
        _ = self.contrat.est_actif
        _ = self.contrat.get_echeances_a_venir()

        _ = self.contrat.mois_restants
        # Paiement properties
        _ = self.paiement.est_en_retard
        _ = self.paiement.montant_restant
        _ = self.paiement.mois_echeance
        _ = self.paiement.message_mois
        # Utilisateur properties
        _ = self.u_loc.is_locataire
        _ = self.u_loc.is_proprietaire
        _ = self.u_loc.is_agent
        _ = self.u_loc.is_admin

    def test_utilisateur_properties(self):
        self.u_admin.nom = "Doe"
        self.u_admin.prenoms = "John"
        self.u_admin.save()
        self.assertEqual(self.u_admin.get_full_name(), "John Doe")
        self.u_admin.nom = ""
        self.assertEqual(self.u_admin.get_full_name(), "John")

