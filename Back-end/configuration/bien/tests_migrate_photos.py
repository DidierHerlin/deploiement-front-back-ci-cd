import io
from django.test import TestCase
from django.core.management import call_command
from bien.models import Bien
from utilisateur.models import Utilisateur, Proprietaire
from unittest.mock import patch

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
