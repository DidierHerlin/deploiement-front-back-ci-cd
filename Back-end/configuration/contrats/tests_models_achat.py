import datetime
from django.test import TestCase
from django.core.exceptions import ValidationError
from contrats.models import Contrat
from bien.models import Bien
from utilisateur.models import Utilisateur, Proprietaire, Locataire

class ContratAchatModelTest(TestCase):
    def setUp(self):
        user_prop = Utilisateur.objects.create(email="prop_achat@test.com", role="PROPRIETAIRE")
        self.prop = Proprietaire.objects.create(user=user_prop)
        
        user_loc = Utilisateur.objects.create(email="loc_achat@test.com", role="LOCATAIRE")
        self.loc = Locataire.objects.create(user=user_loc)
        
        self.bien = Bien.objects.create(
            proprietaire=self.prop,
            titre="Bien Vente",
            type="MAISON",
            mode_transaction="VENTE",
            adresse="1 rue vente",
            surface=100,
            nombre_pieces=4,
            prix=100000.0,
            statut="DISPONIBLE"
        )
        
    def test_creation_contrat_achat_valide(self):
        contrat = Contrat.objects.create(
            bien=self.bien,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE,
            prix=95000.0,
            statut=Contrat.StatutContrat.ACTIF
        )
        self.assertEqual(contrat.type_contrat, "ACHAT")
        self.assertEqual(contrat.statut, "ACTIF")
        self.assertEqual(contrat.type_paiement_achat, "TOTALITE")

    def test_validation_achat_manquant(self):
        contrat = Contrat(
            bien=self.bien,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.ACHAT,
            # Manque type_paiement_achat et prix
            statut=Contrat.StatutContrat.ACTIF
        )
        with self.assertRaises(ValidationError) as cm:
            contrat.clean()
        self.assertIn("prix", cm.exception.message_dict)
        
        contrat.prix = 100000.0
        with self.assertRaises(ValidationError) as cm2:
            contrat.clean()
        self.assertIn("type_paiement_achat", cm2.exception.message_dict)
        
    def test_validation_achat_avec_date_fin(self):
        contrat = Contrat(
            bien=self.bien,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE,
            prix=95000.0,
            date_fin=datetime.date(2026, 12, 31),
            statut=Contrat.StatutContrat.ACTIF
        )
        with self.assertRaises(ValidationError) as cm:
            contrat.clean()
        self.assertIn("date_fin", cm.exception.message_dict)

    def test_finaliser_vente(self):
        contrat = Contrat.objects.create(
            bien=self.bien,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.ACHAT,
            type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE,
            prix=95000.0,
            statut=Contrat.StatutContrat.ACTIF
        )
        contrat.finaliser_vente()
        self.assertEqual(contrat.statut, Contrat.StatutContrat.VENDU)
        
        # Test validation_transition_statut
        with self.assertRaises(ValidationError):
            contrat.statut = Contrat.StatutContrat.ACTIF
            contrat.clean()

    def test_finaliser_vente_sur_location(self):
        bien_loc = Bien.objects.create(
            proprietaire=self.prop,
            titre="Bien Loc",
            type="MAISON",
            mode_transaction="LOCATION",
            adresse="1 rue loc",
            surface=100,
            nombre_pieces=4,
            loyer_mensuel=1000.0,
            statut="DISPONIBLE"
        )
        contrat = Contrat.objects.create(
            bien=bien_loc,
            locataire=self.loc,
            type_contrat=Contrat.TypeContrat.LOCATION,
            loyer=1000.0,
            depot_garantie=1000.0,
            date_debut=datetime.date(2026, 1, 1),
            date_fin=datetime.date(2026, 12, 31),
            statut=Contrat.StatutContrat.ACTIF
        )
        with self.assertRaisesMessage(ValueError, "Seuls les contrats d'achat peuvent être finalisés."):
            contrat.finaliser_vente()
