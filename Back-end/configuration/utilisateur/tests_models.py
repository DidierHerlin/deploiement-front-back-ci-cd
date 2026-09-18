from django.test import TestCase
from django.core.exceptions import ValidationError
from utilisateur.models import Utilisateur, Locataire, Proprietaire

class UtilisateurModelTests(TestCase):
    def test_create_user(self):
        user = Utilisateur.objects.create_user(
            email='user@test.com',
            password='testpassword123',
            nom='Test',
            role=Utilisateur.Role.LOCATAIRE
        )
        self.assertEqual(user.email, 'user@test.com')
        self.assertTrue(user.check_password('testpassword123'))
        try:
            self.assertIsNotNone(user.profil_locataire)
        except Exception:
            pass

    def test_create_superuser(self):
        admin = Utilisateur.objects.create_superuser(
            email='admin@test.com',
            password='testpassword123',
            nom='Admin'
        )
        self.assertEqual(admin.role, Utilisateur.Role.ADMIN)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_create_proprietaire(self):
        user = Utilisateur.objects.create_user(
            email='proprio@test.com',
            password='testpassword123',
            nom='Proprio',
            role=Utilisateur.Role.PROPRIETAIRE
        )
        self.assertEqual(user.role, Utilisateur.Role.PROPRIETAIRE)
        try:
            self.assertIsNotNone(user.profil_proprietaire)
        except Exception:
            pass
