from django.test import TestCase
from bien.models import Bien
from utilisateur.models import Utilisateur, Proprietaire

class BienNewModelTest(TestCase):
    def setUp(self):
        user_prop = Utilisateur.objects.create(email="prop_bien_new@test.com", role="PROPRIETAIRE")
        self.prop = Proprietaire.objects.create(user=user_prop)
        
    def test_est_vendu(self):
        bien = Bien.objects.create(
            proprietaire=self.prop,
            titre="Bien Vendu",
            type="MAISON",
            mode_transaction="VENTE",
            adresse="1 rue vendu",
            surface=100,
            nombre_pieces=4,
            prix=100000.0,
            statut=Bien.StatutBien.VENDU
        )
        self.assertTrue(bien.est_vendu)
        self.assertFalse(bien.est_disponible)
        self.assertFalse(bien.est_loue)
