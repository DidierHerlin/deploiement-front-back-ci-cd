from django.test import TestCase
from utilisateur.models import Utilisateur, Proprietaire, Locataire

class UtilisateurModelTests(TestCase):
    def test_create_user(self):
        user = Utilisateur.objects.create_user(
            email="test@test.com",
            password="pwd",
            nom="Nom",
            prenoms="Prenom",
            role=Utilisateur.Role.LOCATAIRE
        )
        self.assertEqual(user.email, "test@test.com")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertEqual(str(user), "Nom Prenom (Locataire)")
        self.assertEqual(user.get_full_name(), "Prenom Nom")
        self.assertEqual(user.get_short_name(), "Prenom")
        self.assertFalse(user.has_photo())
        self.assertIsNone(user.get_photo_url())

    def test_create_user_no_email(self):
        with self.assertRaises(ValueError):
            Utilisateur.objects.create_user(email="", password="pwd")

    def test_create_superuser(self):
        admin = Utilisateur.objects.create_superuser(
            email="admin@test.com",
            password="pwd",
            nom="Admin",
            prenoms="Admin"
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertEqual(admin.role, Utilisateur.Role.ADMIN)

    def test_proprietaire_str_and_photo(self):
        user = Utilisateur.objects.create_user(email="p@test.com", password="pwd", nom="A", prenoms="B", role=Utilisateur.Role.PROPRIETAIRE)
        prop = Proprietaire.objects.create(user=user, iban="123")
        self.assertEqual(str(prop), "Propriétaire - A B")
        self.assertIsNone(prop.get_photo_url())

    def test_locataire_str_and_photo(self):
        user = Utilisateur.objects.create_user(email="l@test.com", password="pwd", nom="C", prenoms="D", role=Utilisateur.Role.LOCATAIRE)
        loc = Locataire.objects.create(user=user)
        self.assertEqual(str(loc), "Locataire - C D")
        self.assertIsNone(loc.get_photo_url())
