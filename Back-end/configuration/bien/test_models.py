from django.test import TestCase
from django.core.exceptions import ValidationError
from utilisateur.models import Utilisateur, Proprietaire
from bien.models import Bien

class BienModelTests(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(email="prop@test.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.proprietaire = Proprietaire.objects.create(user=self.user)

    def test_create_bien_location_valide(self):
        bien = Bien(
            proprietaire=self.proprietaire,
            titre="Appart",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION,
            adresse="Test",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=500
        )
        bien.full_clean()
        bien.save()
        self.assertTrue(bien.est_disponible)
        self.assertFalse(bien.est_loue)
        self.assertFalse(bien.est_vendu)
        self.assertEqual(str(bien), "Appart \u2014 Disponible")

    def test_bien_location_sans_loyer(self):
        bien = Bien(
            proprietaire=self.proprietaire,
            titre="Appart",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION,
            adresse="Test",
            surface=50,
            nombre_pieces=2
        )
        with self.assertRaises(ValidationError) as context:
            bien.full_clean()
        self.assertIn("loyer_mensuel", context.exception.message_dict)

    def test_bien_vente_sans_prix(self):
        bien = Bien(
            proprietaire=self.proprietaire,
            titre="Maison",
            type=Bien.TypeBien.MAISON,
            mode_transaction=Bien.ModeTransaction.VENTE,
            adresse="Test",
            surface=100,
            nombre_pieces=4
        )
        with self.assertRaises(ValidationError) as context:
            bien.full_clean()
        self.assertIn("prix", context.exception.message_dict)

    def test_terrain_avec_pieces(self):
        bien = Bien(
            proprietaire=self.proprietaire,
            titre="Terrain",
            type=Bien.TypeBien.TERRAIN,
            mode_transaction=Bien.ModeTransaction.VENTE,
            adresse="Test",
            surface=1000,
            nombre_pieces=1,
            prix=50000
        )
        with self.assertRaises(ValidationError) as context:
            bien.full_clean()
        self.assertIn("nombre_pieces", context.exception.message_dict)
