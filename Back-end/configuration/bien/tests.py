from rest_framework import status
from rest_framework.test import APITestCase

from utilisateur.models import Utilisateur, Proprietaire
from bien.models import Bien


class BienReglesMetierTestCase(APITestCase):

    URL_LISTE = "/api/biens/"

    DONNEES_BIEN_VALIDES = {
        "titre": "Bien de test",
        "type": Bien.TypeBien.APPARTEMENT,
        "mode_transaction": Bien.ModeTransaction.LOCATION,
        "adresse": "Tana",
        "surface": 50,
        "nombre_pieces": 3,
        "loyer_mensuel": 500000,
        "prix": None,
        "statut": Bien.StatutBien.DISPONIBLE,
        "photos": [],
    }

    @classmethod
    def setUpTestData(cls):
        cls.user = Utilisateur.objects.create_user(
            email="proprio@test.com", password="pass", role=Utilisateur.Role.PROPRIETAIRE,
            nom="Dupont", prenoms="Jean"
        )
        cls.proprietaire = Proprietaire.objects.create(user=cls.user, iban="FR123")

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def _donnees(self, **overrides) -> dict:
        data = dict(self.DONNEES_BIEN_VALIDES)
        data.update(overrides)
        return data

    def _creer_bien(self, **overrides) -> Bien:
        donnees = self._donnees(**overrides)
        donnees["proprietaire"] = self.proprietaire
        return Bien.objects.create(**donnees)

    # Cohérence mode_transaction / loyer_mensuel / prix

    def test_creation_bien_location_ok(self):
        response = self.client.post(self.URL_LISTE, self._donnees(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_creation_bien_vente_ok(self):
        data = self._donnees(
            titre="Maison à vendre",
            type=Bien.TypeBien.MAISON,
            mode_transaction=Bien.ModeTransaction.VENTE,
            surface=120,
            nombre_pieces=5,
            loyer_mensuel=None,
            prix=150000000,
        )
        response = self.client.post(self.URL_LISTE, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_creation_bien_location_avec_prix_echoue(self):
        data = self._donnees(
            titre="Appart location avec prix",
            nombre_pieces=2,
            loyer_mensuel=400000,
            prix=80000000,
        )
        response = self.client.post(self.URL_LISTE, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_creation_bien_vente_sans_prix_echoue(self):
        data = self._donnees(
            titre="Maison vente sans prix",
            type=Bien.TypeBien.MAISON,
            mode_transaction=Bien.ModeTransaction.VENTE,
            surface=100,
            nombre_pieces=4,
            loyer_mensuel=None,
            prix=None,
        )
        response = self.client.post(self.URL_LISTE, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Règle terrain : nombre_pieces doit être null

    def test_creation_terrain_sans_pieces_ok(self):
        data = self._donnees(
            titre="Terrain à vendre",
            type=Bien.TypeBien.TERRAIN,
            mode_transaction=Bien.ModeTransaction.VENTE,
            surface=200,
            nombre_pieces=None,
            loyer_mensuel=None,
            prix=50000000,
        )
        response = self.client.post(self.URL_LISTE, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_creation_terrain_avec_pieces_echoue(self):
        data = self._donnees(
            titre="Terrain avec pièces",
            type=Bien.TypeBien.TERRAIN,
            mode_transaction=Bien.ModeTransaction.VENTE,
            surface=200,
            nombre_pieces=3,
            loyer_mensuel=None,
            prix=50000000,
        )
        response = self.client.post(self.URL_LISTE, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Interdiction de modifier un bien déjà loué ou vendu

    def test_modification_bien_loue_interdite(self):
        bien = self._creer_bien(
            titre="Bien loué",
            statut=Bien.StatutBien.LOUE,
            surface=60,
            nombre_pieces=2,
            loyer_mensuel=600000,
        )
        response = self.client.patch(f"{self.URL_LISTE}{bien.id}/", {"titre": "Nouveau titre"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_modification_bien_vendu_interdite(self):
        bien = self._creer_bien(
            titre="Bien vendu",
            type=Bien.TypeBien.MAISON,
            mode_transaction=Bien.ModeTransaction.VENTE,
            statut=Bien.StatutBien.VENDU,
            surface=80,
            nombre_pieces=3,
            loyer_mensuel=None,
            prix=100000000,
        )
        response = self.client.patch(f"{self.URL_LISTE}{bien.id}/", {"adresse": "Nouvelle adresse"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Droits de création par rôle

    def test_agent_peut_creer_bien_pour_autre_proprietaire(self):
        agent = Utilisateur.objects.create_user(
            email="agent@test.com", password="pass", role=Utilisateur.Role.AGENT,
            nom="Agent", prenoms="Test"
        )
        self.client.force_authenticate(user=agent)
        data = self._donnees(
            proprietaire_id=self.proprietaire.id,
            titre="Bien par agent",
            nombre_pieces=2,
            loyer_mensuel=300000,
        )
        response = self.client.post(self.URL_LISTE, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        bien = Bien.objects.get(titre="Bien par agent")
        self.assertEqual(bien.proprietaire, self.proprietaire)