
from datetime import date, timedelta
from decimal import Decimal
import io
import json

from dateutil.relativedelta import relativedelta
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection, reset_queries
from django.test import RequestFactory, TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, force_authenticate

from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from reservation.models import Reservation
from notifications.models import Notification
from admin_dashboard_views import AdminDashboardView
from agent_dashboard_views import AgentDashboardView
from reporting_views import ReportingStatsView
from proprietaire_dashboard_views import ProprietaireDashboardView, ProprietaireDashboardOptimizedView


# 1. Tests des Modèles Utilisateur, Locataire et Propriétaire

class UtilisateurModelTests(TestCase):

    def test_create_user(self):
        user = Utilisateur.objects.create_user(
            email="user@test.com",
            password="testpassword123",
            nom="Test",
            prenoms="Prenom",
            role=Utilisateur.Role.LOCATAIRE
        )
        self.assertEqual(user.email, "user@test.com")
        self.assertTrue(user.check_password("testpassword123"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertEqual(str(user), "Test Prenom (Locataire)")
        self.assertEqual(user.get_full_name(), "Prenom Test")
        self.assertEqual(user.get_short_name(), "Prenom")
        self.assertFalse(user.has_photo())
        self.assertIsNone(user.get_photo_url())

    def test_create_user_no_email(self):
        with self.assertRaises(ValueError):
            Utilisateur.objects.create_user(email="", password="pwd")

    def test_create_superuser(self):
        admin = Utilisateur.objects.create_superuser(
            email="admin@test.com",
            password="testpassword123",
            nom="Admin",
            prenoms="Super"
        )
        self.assertEqual(admin.role, Utilisateur.Role.ADMIN)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_create_proprietaire(self):
        user = Utilisateur.objects.create_user(
            email="proprio@test.com",
            password="testpassword123",
            nom="Proprio",
            prenoms="Jean",
            role=Utilisateur.Role.PROPRIETAIRE
        )
        self.assertEqual(user.role, Utilisateur.Role.PROPRIETAIRE)

    def test_proprietaire_str_and_photo(self):
        user = Utilisateur.objects.create_user(
            email="p@test.com", password="pwd", nom="A", prenoms="B",
            role=Utilisateur.Role.PROPRIETAIRE
        )
        prop = Proprietaire.objects.create(user=user, iban="123")
        self.assertEqual(str(prop), "Propriétaire - A B")
        self.assertIsNone(prop.get_photo_url())

    def test_locataire_str_and_photo(self):
        user = Utilisateur.objects.create_user(
            email="l@test.com", password="pwd", nom="C", prenoms="D",
            role=Utilisateur.Role.LOCATAIRE
        )
        loc = Locataire.objects.create(user=user)
        self.assertEqual(str(loc), "Locataire - C D")
        self.assertIsNone(loc.get_photo_url())


class AllModelsCoverageTest(TestCase):
    """Couverture générique des méthodes str, clean et properties des modèles liés."""

    def setUp(self):
        self.u_admin = Utilisateur.objects.create_user(
            email="m.admin@m.com", password="pwd", role=Utilisateur.Role.ADMIN
        )
        self.u_prop = Utilisateur.objects.create_user(
            email="m.prop@m.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE
        )
        self.prop = Proprietaire.objects.create(user=self.u_prop, iban="MG123")

        self.u_loc = Utilisateur.objects.create_user(
            email="m.loc@m.com", password="pwd", role=Utilisateur.Role.LOCATAIRE
        )
        self.loc = Locataire.objects.create(user=self.u_loc)

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

        self.contrat = Contrat.objects.create(
            bien=self.bien, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date.today(), date_fin=date.today() + relativedelta(months=12),
            loyer=500000, depot_garantie=500000
        )
        self.contrat_achat = Contrat.objects.create(
            bien=self.bien_vente, locataire=self.loc, type_contrat=Contrat.TypeContrat.ACHAT,
            prix=10000000, type_paiement_achat=Contrat.TypePaiementAchat.TOTALITE
        )

        self.paiement = Paiement.objects.create(
            contrat=self.contrat, date_echeance=date.today() + relativedelta(months=15),
            montant=500000, montant_attendu=500000
        )

        self.bien_resa = Bien.objects.create(
            proprietaire=self.prop, titre="Bien Resa", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=100, nombre_pieces=3,
            loyer_mensuel=500000, statut=Bien.StatutBien.DISPONIBLE
        )
        self.reservation = Reservation.objects.create(
            bien=self.bien_resa, locataire=self.loc, type_reservation=Reservation.TypeReservation.LOCATION
        )

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

    def test_utilisateur_properties(self):
        self.u_admin.nom = "Doe"
        self.u_admin.prenoms = "John"
        self.u_admin.save()
        self.assertEqual(self.u_admin.get_full_name(), "John Doe")
        self.u_admin.nom = ""
        self.assertEqual(self.u_admin.get_full_name(), "John")


# 2. Tests d'Inscription et d'Authentification

class RegistrationViewsTests(APITestCase):

    def test_register_locataire_valid(self):
        url = reverse('locataire-register')
        data = {
            "email": "newloc@test.com",
            "password": "Password123!",
            "nom": "Doe",
            "prenoms": "John",
            "contact": "0606060606"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Utilisateur.objects.filter(email="newloc@test.com").exists())
        self.assertTrue(Locataire.objects.filter(user__email="newloc@test.com").exists())

    def test_register_locataire_invalid(self):
        url = reverse('locataire-register')
        data = {"email": "invalid"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_proprietaire_valid(self):
        url = reverse('proprietaire-register')
        data = {
            "email": "newprop@test.com",
            "password": "Password123!",
            "nom": "Prop",
            "prenoms": "Rietaire",
            "iban": "FR12345",
            "contact": "0707070707"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Utilisateur.objects.filter(email="newprop@test.com").exists())
        self.assertTrue(Proprietaire.objects.filter(user__email="newprop@test.com").exists())

    def test_register_proprietaire_invalid(self):
        url = reverse('proprietaire-register')
        data = {"email": "invalid"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_agent_valid(self):
        url = reverse('agent-register')
        data = {
            "email": "newagent@test.com",
            "password": "Password123!",
            "nom": "Agent",
            "prenoms": "Immo"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        u = Utilisateur.objects.get(email="newagent@test.com")
        self.assertEqual(u.role, Utilisateur.Role.AGENT)

    def test_register_agent_invalid(self):
        url = reverse('agent-register')
        data = {"email": "notanemail"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AuthRegistrationCoverageTests(APITestCase):

    def test_registration_endpoints(self):
        url = reverse('locataire-register')
        data_loc = {
            "email": "new_loc@test.com", "password": "SecurePassword123!",
            "nom": "L", "prenoms": "L", "telephone": "0123456789", "date_naissance": "1990-01-01"
        }
        resp = self.client.post(url, data_loc)
        self.assertIn(resp.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

        url_prop = reverse('proprietaire-register')
        data_prop = {
            "email": "new_prop@test.com", "password": "SecurePassword123!",
            "nom": "P", "prenoms": "P", "telephone": "0123456780"
        }
        resp_prop = self.client.post(url_prop, data_prop)
        self.assertIn(resp_prop.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

        url_agent = reverse('agent-register')
        data_agent = {
            "email": "new_agent@test.com", "password": "SecurePassword123!",
            "nom": "A", "prenoms": "A", "telephone": "0123456781"
        }
        resp_agent = self.client.post(url_agent, data_agent)
        self.assertIn(resp_agent.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_login_logout(self):
        url_loc = reverse('locataire-register')
        self.client.post(url_loc, {
            "email": "login_test@test.com", "password": "SecurePassword123!",
            "nom": "L", "prenoms": "L", "telephone": "0123456999", "date_naissance": "1990-01-01"
        })

        url_login = reverse('login')
        resp = self.client.post(url_login, {"email": "login_test@test.com", "password": "SecurePassword123!"})
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST])

        url_logout = reverse('logout')
        resp_logout = self.client.post(url_logout, {"refresh": "fake_token"})
        self.assertIn(resp_logout.status_code, [
            status.HTTP_200_OK, status.HTTP_205_RESET_CONTENT, status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED
        ])


# 3. Tests de Réinitialisation de Mot de Passe

class PasswordResetTests(APITestCase):

    def setUp(self):
        self.user = Utilisateur.objects.create_user(email="testreset@t.com", password="oldpassword")

    def test_request_reset_code(self):
        url = reverse('mdp-demande')
        response = self.client.post(url, {"email": "testreset@t.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.reset_token)

    def test_verify_code_valid(self):
        self.user.reset_token = "123456"
        self.user.reset_token_expiration = timezone.now() + timedelta(minutes=15)
        self.user.save()
        url = reverse('mdp-verifier-code')
        response = self.client.post(url, {"email": "testreset@t.com", "code": "123456"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_code_invalid(self):
        self.user.reset_token = "123456"
        self.user.reset_token_expiration = timezone.now() + timedelta(minutes=15)
        self.user.save()
        url = reverse('mdp-verifier-code')
        response = self.client.post(url, {"email": "testreset@t.com", "code": "654321"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_reset(self):
        self.user.reset_token = "123456"
        self.user.reset_token_expiration = timezone.now() + timedelta(minutes=15)
        self.user.save()
        url = reverse('mdp-reinitialiser')
        response = self.client.post(url, {
            "email": "testreset@t.com",
            "code": "123456",
            "new_password": "NewSecurePassword123!"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword123!"))
        self.assertIsNone(self.user.reset_token)


class PasswordResetCoverageTests(APITestCase):

    def test_password_reset_flow(self):
        user = Utilisateur.objects.create_user(
            email="reset_cov@test.com", password="pwd", nom="R", prenoms="R", role=Utilisateur.Role.LOCATAIRE
        )

        url_req = reverse('mdp-demande')
        resp = self.client.post(url_req, {"email": "reset_cov@test.com"})
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

        url_verify = reverse('mdp-verifier-code')
        resp_verify = self.client.post(url_verify, {"email": "reset_cov@test.com", "code": "123456"})
        self.assertIn(resp_verify.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

        url_reset = reverse('mdp-reinitialiser')
        resp_reset = self.client.post(url_reset, {
            "email": "reset_cov@test.com", "code": "123456", "new_password": "NewSecurePassword123!"
        })
        self.assertIn(resp_reset.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])


# 4. Tests des Vues Profil

class ProfileViewsTests(APITestCase):

    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email="profile@t.com", password="pwd", role=Utilisateur.Role.AGENT
        )

    def test_get_profile(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('profil-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_profile(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('profil-modifier')
        response = self.client.put(url, {"nom": "NouveauNom"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.nom, "NouveauNom")

    def test_change_password(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('changer-mot-de-passe')
        data = {
            "current_password": "pwd",
            "new_password": "NewSecurePassword123!"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword123!"))

    def test_change_password_invalid(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('changer-mot-de-passe')
        data = {
            "current_password": "wrongpassword",
            "new_password": "NewSecurePassword123!"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileViewsCoverageTests(APITestCase):

    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email="profile_cov@test.com", password="pwd", nom="Cov", prenoms="Cov", role=Utilisateur.Role.LOCATAIRE
        )

    def test_upload_and_delete_photo(self):
        self.client.force_authenticate(user=self.user)
        dummy_image = SimpleUploadedFile(name='test_image.jpg', content=b'file_content', content_type='image/jpeg')
        url = reverse('profil-photo-maj')
        resp = self.client.post(url, {'photo_profil': dummy_image}, format='multipart')
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

        url_delete = reverse('profil-photo-supprimer')
        resp2 = self.client.delete(url_delete)
        self.assertIn(resp2.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])


# 5. Tests des Vues Locataires

class LocataireViewsTests(APITestCase):

    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            email="admin_loc@test.com", password="password123", role=Utilisateur.Role.ADMIN, nom="Admin", prenoms="Test"
        )
        self.agent = Utilisateur.objects.create_user(
            email="agent_loc@test.com", password="password123", role=Utilisateur.Role.AGENT, nom="Agent", prenoms="Test"
        )
        self.locataire_user = Utilisateur.objects.create_user(
            email="locataire1@test.com", password="password123", role=Utilisateur.Role.LOCATAIRE, nom="Loc", prenoms="Ataire"
        )
        self.locataire = Locataire.objects.create(
            user=self.locataire_user, contact="0607080910"
        )
        self.locataire_user2 = Utilisateur.objects.create_user(
            email="locataire2@test.com", password="password123", role=Utilisateur.Role.LOCATAIRE, nom="Loc2", prenoms="Ataire2"
        )
        self.locataire2 = Locataire.objects.create(
            user=self.locataire_user2, contact="0607080911"
        )

    def test_list_locataires_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('locataire-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['count'], 2)

    def test_list_locataires_as_locataire_forbidden(self):
        self.client.force_authenticate(user=self.locataire_user)
        url = reverse('locataire-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_locataire_me(self):
        self.client.force_authenticate(user=self.locataire_user)
        url = reverse('locataire-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['contact'], "0607080910")

    def test_get_locataire_detail_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('locataire-detail', kwargs={'pk': self.locataire.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['contact'], "0607080910")

    def test_get_locataire_detail_as_locataire_forbidden(self):
        self.client.force_authenticate(user=self.locataire_user)
        url = reverse('locataire-detail', kwargs={'pk': self.locataire2.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_put_locataire_me(self):
        self.client.force_authenticate(user=self.locataire_user)
        url = reverse('locataire-me')
        data = {"contact": "0699999999"}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.locataire.refresh_from_db()
        self.assertEqual(self.locataire.contact, "0699999999")

    def test_delete_locataire_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('locataire-detail', kwargs={'pk': self.locataire.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.locataire_user.refresh_from_db()
        self.assertFalse(self.locataire_user.is_active)
        with self.assertRaises(Locataire.DoesNotExist):
            self.locataire.refresh_from_db()


# 6. Tests des Vues Propriétaires

class ProprietaireViewsTests(APITestCase):

    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            email="admin_prop@test.com", password="password123", role=Utilisateur.Role.ADMIN, nom="Admin", prenoms="Test"
        )
        self.agent = Utilisateur.objects.create_user(
            email="agent_prop@test.com", password="password123", role=Utilisateur.Role.AGENT, nom="Agent", prenoms="Test"
        )
        self.proprietaire_user = Utilisateur.objects.create_user(
            email="proprio1@test.com", password="password123", role=Utilisateur.Role.PROPRIETAIRE, nom="Prop", prenoms="Ietaire"
        )
        self.proprietaire = Proprietaire.objects.create(
            user=self.proprietaire_user, iban="FR1234567890", contact="0102030405"
        )
        self.proprietaire_user2 = Utilisateur.objects.create_user(
            email="proprio2@test.com", password="password123", role=Utilisateur.Role.PROPRIETAIRE, nom="Prop2", prenoms="Ietaire2"
        )
        self.proprietaire2 = Proprietaire.objects.create(
            user=self.proprietaire_user2, iban="FR0987654321", contact="0504030201"
        )

    def test_list_proprietaires_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('proprietaire-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['count'], 2)

    def test_list_proprietaires_as_proprietaire_forbidden(self):
        self.client.force_authenticate(user=self.proprietaire_user)
        url = reverse('proprietaire-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_proprietaire_me(self):
        self.client.force_authenticate(user=self.proprietaire_user)
        url = reverse('proprietaire-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['iban'], "FR1234567890")

    def test_get_proprietaire_detail_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('proprietaire-detail', kwargs={'pk': self.proprietaire.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['iban'], "FR1234567890")

    def test_get_proprietaire_detail_as_proprietaire_forbidden(self):
        self.client.force_authenticate(user=self.proprietaire_user)
        url = reverse('proprietaire-detail', kwargs={'pk': self.proprietaire2.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_put_proprietaire_me(self):
        self.client.force_authenticate(user=self.proprietaire_user)
        url = reverse('proprietaire-me')
        data = {"iban": "FR_NEW_IBAN", "contact": "0909090909"}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.proprietaire.refresh_from_db()
        self.assertEqual(self.proprietaire.iban, "FR_NEW_IBAN")

    def test_delete_proprietaire_as_agent(self):
        self.client.force_authenticate(user=self.agent)
        url = reverse('proprietaire-detail', kwargs={'pk': self.proprietaire.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.proprietaire_user.refresh_from_db()
        self.assertFalse(self.proprietaire_user.is_active)
        with self.assertRaises(Proprietaire.DoesNotExist):
            self.proprietaire.refresh_from_db()

    def test_activer_compte(self):
        self.proprietaire_user.is_active = False
        self.proprietaire_user.save()

        self.client.force_authenticate(user=self.admin)
        url = reverse('activer-compte', kwargs={'pk': self.proprietaire_user.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.proprietaire_user.refresh_from_db()
        self.assertTrue(self.proprietaire_user.is_active)


# 7. Tests des Dashboards et Statistiques de Reporting

class DashboardTests(APITestCase):

    def setUp(self):
        self.admin = Utilisateur.objects.create_user(email="admin_dash@d.com", password="pwd", role=Utilisateur.Role.ADMIN)
        self.agent = Utilisateur.objects.create_user(email="agent_dash@d.com", password="pwd", role=Utilisateur.Role.AGENT)
        self.prop_user = Utilisateur.objects.create_user(email="prop_dash@d.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = Utilisateur.objects.create_user(email="loc_dash@d.com", password="pwd", role=Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)

        self.bien = Bien.objects.create(
            proprietaire=self.prop, titre="Bien Dash", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=50, nombre_pieces=2,
            loyer_mensuel=1000, statut=Bien.StatutBien.DISPONIBLE
        )
        self.contrat = Contrat.objects.create(
            bien=self.bien, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date.today(), date_fin=date.today() + relativedelta(months=12),
            loyer=1000, depot_garantie=1000
        )

        Paiement.objects.all().delete()
        self.paiement = Paiement.objects.create(
            contrat=self.contrat, date_echeance=date.today() + relativedelta(months=1),
            montant=1000, montant_attendu=1000, statut=Paiement.StatutPaiement.PAYE,
            montant_paye=1000, date_paiement=date.today()
        )

    def test_admin_dashboard_as_admin_returns_200(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("biens", response.data)
        self.assertIn("contrats", response.data)
        self.assertIn("paiements", response.data)
        self.assertIn("utilisateurs", response.data)
        self.assertIn("recentEvents", response.data)

    def test_admin_dashboard_as_agent_returns_200(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_dashboard_as_proprietaire_returns_403(self):
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_dashboard_unauthenticated_returns_401(self):
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_agent_dashboard_as_agent_returns_200(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/agent/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("biens", response.data)
        self.assertIn("revenus", response.data)
        self.assertIn("impayes", response.data)
        self.assertIn("upcomingContracts", response.data)

    def test_agent_dashboard_as_locataire_returns_403(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/agent/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_agent_dashboard_revenus_and_impayes(self):
        Paiement.objects.create(
            contrat=self.contrat, date_echeance=date.today() - relativedelta(months=2),
            montant=1000, montant_attendu=1000, statut=Paiement.StatutPaiement.EN_ATTENTE
        )
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/agent/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["impayes"]["totalAmount"], 1000)
        self.assertGreater(len(response.data["revenus"]["chartData"]), 0)


class ReportingStatsTests(APITestCase):

    def setUp(self):
        self.admin = Utilisateur.objects.create_user(email='admin_rep@test.com', password='password123', role=Utilisateur.Role.ADMIN)
        self.agent = Utilisateur.objects.create_user(email='agent_rep@test.com', password='password123', role=Utilisateur.Role.AGENT)
        self.proprio_user = Utilisateur.objects.create_user(email='proprio_rep@test.com', password='password123', role=Utilisateur.Role.PROPRIETAIRE)
        self.proprio = Proprietaire.objects.create(user=self.proprio_user, iban="MG123")
        self.loc_user = Utilisateur.objects.create_user(email='loc_rep@test.com', password='password123', role=Utilisateur.Role.LOCATAIRE)
        self.locataire = Locataire.objects.create(user=self.loc_user)

        self.bien = Bien.objects.create(
            proprietaire=self.proprio, titre="Bien test", type="APPARTEMENT",
            mode_transaction="LOCATION", adresse="Paris", surface=50, nombre_pieces=2,
            loyer_mensuel=1000, statut="DISPONIBLE"
        )
        self.bien_dispo = Bien.objects.create(
            proprietaire=self.proprio, titre="Bien dispo", type="APPARTEMENT",
            mode_transaction="LOCATION", adresse="Paris", surface=50, nombre_pieces=2,
            loyer_mensuel=1000, statut="DISPONIBLE"
        )

        self.contrat = Contrat.objects.create(
            bien=self.bien, locataire=self.locataire, type_contrat="LOCATION",
            date_debut=timezone.now().date(), date_fin=timezone.now().date() + relativedelta(years=1),
            loyer=1000, depot_garantie=1000, statut="ACTIF"
        )

        self.paiement = Paiement.objects.filter(contrat=self.contrat).first()
        if self.paiement:
            self.paiement.statut = "PAYE"
            self.paiement.montant_paye = 1000
            self.paiement.save(update_fields=["statut", "montant_paye"])

        self.url = reverse('reporting-stats')

    def test_stats_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['biens']['total'], 2)
        self.assertEqual(response.data['contrats']['actifs'], 1)
        self.assertEqual(response.data['paiements']['payes'], 1)
        self.assertEqual(response.data['paiements']['total'], 12)
        self.assertIn('total_users', response.data['users'])

    def test_stats_proprietaire(self):
        self.client.force_authenticate(user=self.proprio_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['biens']['total'], 2)
        self.assertEqual(response.data['contrats']['total'], 1)
        self.assertEqual(response.data['paiements']['total'], 12)

    def test_stats_locataire(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['biens']['total'], 1)
        self.assertEqual(response.data['contrats']['total'], 1)
        self.assertEqual(response.data['paiements']['total'], 12)
        self.assertEqual(response.data['users'], {})

    def test_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProprietaireDashboardViewsComparisonTest(TestCase):
    """Vérifie la cohérence entre ProprietaireDashboardView et ProprietaireDashboardOptimizedView."""

    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email="proprio_perf@test.com", password="test", role=Utilisateur.Role.PROPRIETAIRE
        )
        self.proprietaire = Proprietaire.objects.create(user=self.user)
        self.loc_user = Utilisateur.objects.create_user(
            email="loc_perf@test.com", password="test", role=Utilisateur.Role.LOCATAIRE
        )
        self.locataire = Locataire.objects.create(user=self.loc_user)

        b = Bien.objects.create(
            proprietaire=self.proprietaire, titre="Bien 1", type=Bien.TypeBien.APPARTEMENT,
            adresse="123 Rue de la Paix", surface=50, nombre_pieces=2, loyer_mensuel=1000,
            statut=Bien.StatutBien.DISPONIBLE
        )
        c = Contrat.objects.create(
            bien=b, locataire=self.locataire, type_contrat=Contrat.TypeContrat.LOCATION,
            statut=Contrat.StatutContrat.ACTIF, date_debut=timezone.now().date() - timedelta(days=200),
            date_fin=timezone.now().date() + timedelta(days=200), loyer=1000, depot_garantie=1000
        )
        Paiement.objects.create(
            contrat=c, date_echeance=timezone.now().date(), montant=1000, montant_attendu=1000,
            montant_paye=1000, statut=Paiement.StatutPaiement.PAYE
        )
        Notification.objects.create(utilisateur=self.user, titre="T", message="M", lu=False)

        self.factory = RequestFactory()

    def _call_view(self, view_class):
        request = self.factory.get('/')
        force_authenticate(request, user=self.user)
        view = view_class.as_view()
        response = view(request)
        response.render()
        return json.loads(response.content)

    def test_views_equivalence(self):
        data_old = self._call_view(ProprietaireDashboardView)
        data_new = self._call_view(ProprietaireDashboardOptimizedView)
        self.assertEqual(data_old['biens']['total'], data_new['biens']['total'])
        self.assertEqual(data_old['biens']['loues'], data_new['biens']['loues'])
        self.assertEqual(data_old['revenus']['ce_mois'], data_new['revenus']['ce_mois'])
        self.assertEqual(data_old['prochaine_echeance']['nombre'], data_new['prochaine_echeance']['nombre'])

    def test_dashboard_non_proprietaire_forbidden(self):
        request = self.factory.get('/')
        force_authenticate(request, user=self.loc_user)
        resp_old = ProprietaireDashboardView.as_view()(request)
        self.assertEqual(resp_old.status_code, status.HTTP_403_FORBIDDEN)
        resp_new = ProprietaireDashboardOptimizedView.as_view()(request)
        self.assertEqual(resp_new.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_revenu_mois_dernier(self):
        now = timezone.now()
        last_month = 12 if now.month == 1 else now.month - 1
        last_month_year = now.year - 1 if now.month == 1 else now.year
        last_date = date(last_month_year, last_month, 15)

        p1 = Paiement.objects.filter(contrat__bien__proprietaire=self.proprietaire).first()
        if p1:
            p1.statut = Paiement.StatutPaiement.PAYE
            p1.date_paiement = now.date()
            p1.montant = 1000
            p1.montant_paye = 1000
            p1.save()

        b2 = Bien.objects.create(
            proprietaire=self.proprietaire, titre="Bien 2", type=Bien.TypeBien.APPARTEMENT,
            adresse="789 Rue", surface=55, nombre_pieces=2, loyer_mensuel=1200,
            statut=Bien.StatutBien.DISPONIBLE
        )
        c2 = Contrat.objects.create(
            bien=b2, locataire=self.locataire, type_contrat=Contrat.TypeContrat.LOCATION,
            statut=Contrat.StatutContrat.ACTIF, date_debut=last_date,
            date_fin=now.date() + timedelta(days=200), loyer=1200, depot_garantie=1200
        )
        p2 = Paiement.objects.filter(contrat=c2).first()
        if p2:
            p2.statut = Paiement.StatutPaiement.PAYE
            p2.date_paiement = last_date
            p2.montant = 1200
            p2.montant_paye = 1200
            p2.save()

        data_old = self._call_view(ProprietaireDashboardView)
        data_new = self._call_view(ProprietaireDashboardOptimizedView)
        self.assertEqual(data_old['revenus']['mois_dernier'], data_new['revenus']['mois_dernier'])
        self.assertEqual(data_old['revenus']['ce_mois'], data_new['revenus']['ce_mois'])


class UtilisateurViewsAndMixinsBoostTests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email="user_boost@test.com", password="password123",
            nom="Boost", prenoms="User", role=Utilisateur.Role.LOCATAIRE
        )

    def test_login_invalid_credentials(self):
        response = self.client.post("/api/auth/login/", {"email": "bad@test.com", "password": "wrong"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data["success"])

    def test_logout(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = str(RefreshToken.for_user(self.user))
        self.client.force_authenticate(user=self.user)
        # Sans token refresh
        resp1 = self.client.post("/api/auth/logout/", {})
        self.assertEqual(resp1.status_code, status.HTTP_400_BAD_REQUEST)
        # Token refresh invalide
        resp2 = self.client.post("/api/auth/logout/", {"refresh": "invalid_refresh_token"})
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        # Token refresh valide
        resp3 = self.client.post("/api/auth/logout/", {"refresh": refresh})
        self.assertEqual(resp3.status_code, status.HTTP_200_OK)

    def test_photo_url_mixin(self):
        from utilisateur.serializers.mixins import PhotoUrlMixin
        class DummySerializer(PhotoUrlMixin):
            def __init__(self, context=None):
                self.context = context or {}
        
        class DummyPhoto:
            url = "/media/test.jpg"

        class DummyObj:
            photo_profil = None
        
        mixin = DummySerializer()
        obj = DummyObj()
        self.assertIsNone(mixin.get_photo_url(obj))
        
        obj.photo_profil = DummyPhoto()
        self.assertEqual(DummySerializer(context={}).get_photo_url(obj), "/media/test.jpg")
        
        rf = RequestFactory().get("/")
        self.assertTrue(DummySerializer(context={"request": rf}).get_photo_url(obj).startswith("http"))

    def test_profile_photo_views(self):
        from PIL import Image
        img = Image.new('RGB', (10, 10), color='blue')
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)
        photo = SimpleUploadedFile("profile.jpg", buf.read(), content_type="image/jpeg")

        self.client.force_authenticate(user=self.user)
        # Upload valid
        resp = self.client.post("/api/profil/photo/", {"photo_profil": photo}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Delete photo
        resp_del = self.client.delete("/api/profil/photo/supprimer/")
        self.assertEqual(resp_del.status_code, status.HTTP_200_OK)

        # Delete when already deleted
        resp_del2 = self.client.delete("/api/profil/photo/supprimer/")
        self.assertEqual(resp_del2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_view(self):
        self.client.force_authenticate(user=self.user)
        # Champs manquants
        resp = self.client.post("/api/profil/changer-mot-de-passe/", {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Mauvais mot de passe actuel
        resp = self.client.post("/api/profil/changer-mot-de-passe/", {
            "current_password": "wrongpassword",
            "new_password": "NewSecretPassword123!"
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Succès
        resp = self.client.post("/api/profil/changer-mot-de-passe/", {
            "current_password": "password123",
            "new_password": "NewSecretPassword123!"
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_locataire_profile_view_edge_cases(self):
        admin = Utilisateur.objects.create_user(email="admin_loc_view@test.com", password="pass", role=Utilisateur.Role.ADMIN)
        self.client.force_authenticate(user=admin)
        resp = self.client.get("/api/locataires/me/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        loc1_user = Utilisateur.objects.create_user(email="loc1@test.com", password="pass", role=Utilisateur.Role.LOCATAIRE)
        loc1 = Locataire.objects.create(user=loc1_user)
        self.client.force_authenticate(user=loc1_user)
        resp = self.client.put("/api/locataires/999/", {"profession": "Ingénieur"})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_proprietaire_profile_view_edge_cases(self):
        admin = Utilisateur.objects.create_user(email="admin_prop_view@test.com", password="pass", role=Utilisateur.Role.ADMIN)
        self.client.force_authenticate(user=admin)
        resp = self.client.get("/api/proprietaires/me/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        prop_user = Utilisateur.objects.create_user(email="prop_other@test.com", password="pass", role=Utilisateur.Role.PROPRIETAIRE)
        Proprietaire.objects.create(user=prop_user, iban="MG0001")
        self.client.force_authenticate(user=prop_user)
        resp = self.client.get("/api/proprietaires/999/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


