import io
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from bien.models import Bien
from utilisateur.models import Proprietaire, Utilisateur
import profile_biens


# 1. Tests des Règles Métier (API)

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


# 2. Tests des Modèles Bien

class BienModelTests(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email='proprio@test.com',
            password='testpassword123',
            nom='Proprio',
            prenoms='Test',
            role=Utilisateur.Role.PROPRIETAIRE
        )
        self.proprietaire = Proprietaire.objects.create(user=self.user, iban='FR761234567890')

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
        self.assertEqual(str(bien), "Appart test — Disponible")

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
            nombre_pieces=2,  
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
            loyer_mensuel=None 
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

    def test_est_vendu(self):
        bien = Bien.objects.create(
            proprietaire=self.proprietaire,
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


# 3. Tests des Vues API Bien

class BienViewsTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = Utilisateur.objects.create_superuser(
            email='admin@test.com',
            password='testpassword123',
            nom='Admin'
        )
        cls.proprio_user = Utilisateur.objects.create_user(
            email='proprio_v@test.com',
            password='testpassword123',
            nom='Proprio',
            role=Utilisateur.Role.PROPRIETAIRE
        )
        cls.locataire_user = Utilisateur.objects.create_user(
            email='locataire_v@test.com',
            password='testpassword123',
            nom='Locataire',
            role=Utilisateur.Role.LOCATAIRE
        )
        cls.proprio = Proprietaire.objects.create(user=cls.proprio_user, iban="MG123")
        cls.bien = Bien.objects.create(
            proprietaire=cls.proprio,
            titre="Appart test",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION,
            adresse="1 rue test",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=1000,
            statut=Bien.StatutBien.DISPONIBLE
        )

    def test_list_biens_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/biens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_biens_proprio(self):
        self.client.force_authenticate(user=self.proprio_user)
        response = self.client.get('/api/biens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_biens_locataire(self):
        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get('/api/biens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_bien_admin(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "proprietaire_id": self.proprio.id,
            "titre": "Nouveau bien",
            "type": Bien.TypeBien.MAISON,
            "mode_transaction": Bien.ModeTransaction.VENTE,
            "adresse": "123 test",
            "surface": 100,
            "nombre_pieces": 4,
            "prix": 200000
        }
        response = self.client.post('/api/biens/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_disponibles(self):
        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get('/api/biens/disponible/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_retrieve_bien(self):
        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get(f'/api/biens/{self.bien.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_bien(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/biens/{self.bien.id}/', {"titre": "Updated"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_bien(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/biens/{self.bien.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_list_biens_filtering(self):
        self.client.force_authenticate(user=self.admin)
        Bien.objects.create(
            proprietaire=self.bien.proprietaire,
            titre="Maison Vente",
            type=Bien.TypeBien.MAISON,
            mode_transaction=Bien.ModeTransaction.VENTE,
            adresse="Test",
            surface=100,
            nombre_pieces=4,
            prix=100000,
            statut=Bien.StatutBien.DISPONIBLE
        )
        response = self.client.get('/api/biens/?type=MAISON&mode_transaction=VENTE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['titre'], "Maison Vente")

    def test_disponibles_filtering(self):
        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get('/api/biens/disponible/?statut=DISPONIBLE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertTrue(response.data['success'])

    def test_anonymous_access_list_public(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/biens/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for b in response.data['results']:
            self.assertEqual(b['statut'], Bien.StatutBien.DISPONIBLE)

    def test_anonymous_access_disponibles_public(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/biens/disponible/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_anonymous_access_retrieve_disponible_public(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/biens/{self.bien.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['id'], self.bien.id)

    def test_anonymous_cannot_retrieve_non_disponible(self):
        bien_loue = Bien.objects.create(
            proprietaire=self.bien.proprietaire,
            titre="Bien Loué",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION,
            adresse="Rue Loue",
            surface=40,
            nombre_pieces=2,
            loyer_mensuel=600,
            statut=Bien.StatutBien.LOUE
        )
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/biens/{bien_loue.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_anonymous_cannot_bypass_statut_filter(self):
        Bien.objects.create(
            proprietaire=self.bien.proprietaire,
            titre="Bien Vendu Secret",
            type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.VENTE,
            adresse="Rue Vente",
            surface=80,
            nombre_pieces=3,
            prix=150000,
            statut=Bien.StatutBien.VENDU
        )
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/biens/?statut=VENDU')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for b in response.data['results']:
            self.assertEqual(b['statut'], Bien.StatutBien.DISPONIBLE)

    def test_anonymous_write_actions_forbidden(self):
        self.client.force_authenticate(user=None)
        create_resp = self.client.post('/api/biens/', {"titre": "Hack"})
        self.assertEqual(create_resp.status_code, status.HTTP_401_UNAUTHORIZED)
        update_resp = self.client.patch(f'/api/biens/{self.bien.id}/', {"titre": "Hack"})
        self.assertEqual(update_resp.status_code, status.HTTP_401_UNAUTHORIZED)
        delete_resp = self.client.delete(f'/api/biens/{self.bien.id}/')
        self.assertEqual(delete_resp.status_code, status.HTTP_401_UNAUTHORIZED)


# 4. Tests Commande migrate_photos

class MigratePhotosCommandTest(TestCase):
    def setUp(self):
        user = Utilisateur.objects.create(email="prop_mig@test.com", role="PROPRIETAIRE")
        prop = Proprietaire.objects.create(user=user)
        self.bien1 = Bien.objects.create(
            proprietaire=prop,
            titre="Bien 1",
            type="APPARTEMENT",
            mode_transaction="LOCATION",
            adresse="1 rue test",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=500,
            photos=["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "http://example.com/normal.jpg"]
        )
        self.bien2 = Bien.objects.create(
            proprietaire=prop,
            titre="Bien 2",
            type="APPARTEMENT",
            mode_transaction="LOCATION",
            adresse="2 rue test",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=500,
            photos=["http://example.com/normal.jpg"]
        )
        self.bien3 = Bien.objects.create(
            proprietaire=prop,
            titre="Bien 3",
            type="APPARTEMENT",
            mode_transaction="LOCATION",
            adresse="3 rue test",
            surface=50,
            nombre_pieces=2,
            loyer_mensuel=500,
            photos=[]
        )

    @patch('bien.management.commands.migrate_photos.save_base64_photos')
    def test_migrate_photos_command(self, mock_save):
        mock_save.return_value = ["/media/biens/mocked.jpg", "http://example.com/normal.jpg"]
        
        out = io.StringIO()
        call_command('migrate_photos', stdout=out)
        
        self.bien1.refresh_from_db()
        self.assertEqual(self.bien1.photos[0], "/media/biens/mocked.jpg")
        
        self.bien2.refresh_from_db()
        self.assertEqual(self.bien2.photos[0], "http://example.com/normal.jpg")
        
        self.assertIn("Successfully updated 1 biens.", out.getvalue())
        mock_save.assert_called_once_with(["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "http://example.com/normal.jpg"])


# 5. Tests Profilage Biens

class ProfileBiensTest(TestCase):
    @patch('profile_biens.print')
    def test_run_profile(self, mock_print):
        profile_biens.run_profile()
        self.assertTrue(mock_print.called)


# 6. Tests Utils Photos Base64

class SaveBase64PhotosUtilsTest(TestCase):
    def test_save_base64_png(self):
        from bien.utils import save_base64_photos
        valid_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        result = save_base64_photos([valid_b64])
        self.assertEqual(len(result), 1)
        self.assertTrue(result[0].endswith(".jpg"))

    def test_save_base64_jpeg_and_rgba(self):
        from PIL import Image
        import base64
        from bien.utils import save_base64_photos
        img = Image.new('RGBA', (20, 20), color=(255, 0, 0, 128))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        b64_str = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"
        result = save_base64_photos([b64_str])
        self.assertEqual(len(result), 1)
        self.assertTrue(result[0].endswith(".jpg"))

    def test_save_base64_invalid_fallback(self):
        from bien.utils import save_base64_photos
        bad_b64 = "data:image/png;base64,invalid_base64_payload!!!"
        result = save_base64_photos([bad_b64])
        self.assertEqual(result, [bad_b64])

    def test_non_base64_passthrough(self):
        from bien.utils import save_base64_photos
        url = "https://example.com/photo.jpg"
        result = save_base64_photos([url])
        self.assertEqual(result, [url])

