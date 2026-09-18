from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from utilisateur.models import Utilisateur, Proprietaire
from bien.models import Bien
from datetime import timedelta

class BienModelTests(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email='proprio@test.com',
            password='testpassword123',
            nom='Proprio',
            prenoms='Test',
            role=Utilisateur.Role.PROPRIETAIRE
        )
        self.proprietaire = self.user.profil_proprietaire

    def test_bien_creation_location(self):
        bien = Bien(
            proprietaire=self.proprietaire,
            titre="Appart test",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION,
            adresse="1 rue test",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=1000
        )
        bien.full_clean()
        bien.save()
        self.assertEqual(bien.titre, "Appart test")
        self.assertTrue(bien.est_disponible)
        self.assertFalse(bien.est_loue)
        self.assertFalse(bien.est_vendu)

    def test_bien_creation_vente(self):
        bien = Bien(
            proprietaire=self.proprietaire,
            titre="Appart test vente",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.VENTE,
            adresse="1 rue test",
            surface=50,
            nombre_pieces=2,
            prix=100000
        )
        bien.full_clean()
        bien.save()
        self.assertEqual(bien.mode_transaction, Bien.ModeTransaction.VENTE)

    def test_bien_terrain_validation(self):
        bien = Bien(
            proprietaire=self.proprietaire,
            titre="Terrain test",
            type=Bien.TypeBien.TERRAIN,
            mode_transaction=Bien.ModeTransaction.VENTE,
            adresse="1 rue test",
            surface=500,
            nombre_pieces=2,  # Invalid for terrain
            prix=100000
        )
        with self.assertRaises(ValidationError):
            bien.full_clean()

    def test_bien_loyer_validation(self):
        bien = Bien(
            proprietaire=self.proprietaire,
            titre="Appart test",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION,
            adresse="1 rue test",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=None # Invalid for location
        )
        with self.assertRaises(ValidationError):
            bien.full_clean()
