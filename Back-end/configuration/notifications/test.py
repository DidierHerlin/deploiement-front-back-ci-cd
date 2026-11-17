"""
Tests complets pour l'application Notifications.
Couvre : modèles, services d'envoi, commande verifier_echeances, vues API, permissions et filtres.
"""
import datetime
from unittest.mock import patch

from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bien.models import Bien
from contrats.models import Contrat
from notifications.models import Notification
from notifications.services import NotificationService
from paiement.models import Paiement
from utilisateur.models import Locataire, Proprietaire, Utilisateur


# Helpers

def create_user(email, password="TestPass123!", role="LOCATAIRE"):
    return Utilisateur.objects.create_user(email=email, password=password, role=role)


def create_notification(utilisateur, type_notif="AUTRE", titre="Test", message="Corps du message", lu=False):
    return Notification.objects.create(
        utilisateur=utilisateur,
        type=type_notif,
        titre=titre,
        message=message,
        lu=lu,
    )


# 1. Tests des Services de Notification & Commandes Management

class NotificationServiceTests(TestCase):
    @classmethod
    def setUpClass(cls):
        cls._pisa_patcher = patch(
            "paiement.utils.pisa.pisaDocument",
            side_effect=lambda src, dest, *a, **kw: (
                dest.write(b"%PDF-1.4 mock\n%%EOF") if hasattr(dest, "write") else None,
                type("Status", (), {"err": 0})()
            )[1]
        )
        cls._pisa_patcher.start()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        cls._pisa_patcher.stop()
        super().tearDownClass()

    @classmethod
    def setUpTestData(cls):
        cls.locataire_user = Utilisateur.objects.create_user(email="loc@test.com", password="pwd", nom="L", role=Utilisateur.Role.LOCATAIRE)
        cls.locataire_user2 = Utilisateur.objects.create_user(email="loc2@test.com", password="pwd", nom="L2", role=Utilisateur.Role.LOCATAIRE)
        cls.prop_user = Utilisateur.objects.create_user(email="prop@test.com", password="pwd", nom="P", role=Utilisateur.Role.PROPRIETAIRE)
        cls.loc = Locataire.objects.create(user=cls.locataire_user)
        cls.prop = Proprietaire.objects.create(user=cls.prop_user, iban="MG123")
        cls.bien = Bien.objects.create(proprietaire=cls.prop, titre="Appartement", adresse="Test", loyer_mensuel=500, type="APPARTEMENT", mode_transaction="LOCATION", surface=50, nombre_pieces=2)

    def setUp(self):
        mail.outbox.clear()

    def test_contrat_creation_notification(self):
        contrat = Contrat.objects.create(bien=self.bien, locataire=self.loc, type_contrat="LOCATION", loyer=500, depot_garantie=500, date_debut=timezone.now().date(), date_fin=timezone.now().date() + datetime.timedelta(days=365))
        NotificationService.envoyer(
            utilisateur=self.locataire_user,
            type_notif=Notification.Type.CONTRAT_CREE,
            titre="Nouveau contrat",
            message="Contrat créé.",
            lien=f"/contrats/{contrat.id}",
            contexte_email={"contrat": contrat, "bien": contrat.bien}
        )
        self.assertEqual(Notification.objects.filter(type=Notification.Type.CONTRAT_CREE).count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Nouveau contrat", mail.outbox[0].subject)

    def test_paiement_valide_notification(self):
        contrat = Contrat.objects.create(bien=self.bien, locataire=self.loc, type_contrat="LOCATION", loyer=500, depot_garantie=500, date_debut=timezone.now().date(), date_fin=timezone.now().date() + datetime.timedelta(days=365))
        paiement = Paiement.objects.filter(contrat=contrat).first()
        if not paiement:
            paiement = Paiement.objects.create(contrat=contrat, num_echeance=1, date_echeance=timezone.now().date(), montant_attendu=500, montant=500, statut=Paiement.StatutPaiement.EN_ATTENTE)
        
        paiement.valider_paiement()
        NotificationService.envoyer(
            utilisateur=self.locataire_user,
            type_notif=Notification.Type.PAIEMENT_VALIDE,
            titre="Paiement validé",
            message="Paiement ok",
            lien=f"/quittance/{paiement.id}",
            contexte_email={"paiement": paiement}
        )
        self.assertEqual(Notification.objects.filter(type=Notification.Type.PAIEMENT_VALIDE).count(), 1)
        self.assertGreaterEqual(len(mail.outbox), 1)

    def test_paiement_valide_email_format_rakoto_be(self):
        rakoto_user = Utilisateur.objects.create_user(
            email="rakoto.be@test.com", password="pwd", nom="Be", prenoms="Rakoto", role=Utilisateur.Role.LOCATAIRE
        )
        locataire = Locataire.objects.create(user=rakoto_user)
        bien_studio = Bien.objects.create(
            proprietaire=self.prop,
            titre="Studio de luxe",
            adresse="Ivandry",
            loyer_mensuel=450000,
            type="APPARTEMENT",
            mode_transaction="LOCATION",
            surface=40,
            nombre_pieces=1,
        )
        contrat = Contrat.objects.create(
            bien=bien_studio,
            locataire=locataire,
            type_contrat="LOCATION",
            loyer=450000,
            depot_garantie=450000,
            date_debut=datetime.date(2026, 11, 1),
            date_fin=datetime.date(2027, 10, 31),
        )
        paiement = Paiement.objects.filter(contrat=contrat).first()
        if not paiement:
            paiement = Paiement.objects.create(
                contrat=contrat,
                num_echeance=1,
                date_echeance=datetime.date(2026, 11, 17),
                date_paiement=datetime.date(2026, 11, 17),
                montant_attendu=450000.00,
                montant=450000.00,
                statut=Paiement.StatutPaiement.PAYE,
            )
        else:
            paiement.date_paiement = datetime.date(2026, 11, 17)
            paiement.statut = Paiement.StatutPaiement.PAYE
            paiement.save()

        with self.settings(BACKEND_PUBLIC_URL="https://api.immoconnect.mg"):
            NotificationService.notifier_paiement_valide(paiement)

        emails_loc = [e for e in mail.outbox if rakoto_user.email in e.to]
        self.assertEqual(len(emails_loc), 1)
        email = emails_loc[0]

        # Vérifications sur le texte brut
        self.assertIn("Bonjour Rakoto Be,", email.body)
        self.assertIn("Votre paiement a été validé avec succès.", email.body)
        self.assertIn("Montant : 450 000 Ar", email.body)
        self.assertIn("Date du paiement : 17 novembre 2026", email.body)
        self.assertIn("Contrat concerné : Studio de luxe", email.body)
        self.assertIn("Télécharger la quittance PDF", email.body)
        expected_url = f"https://api.immoconnect.mg/api/paiements/{paiement.pk}/quittance/"
        self.assertIn(expected_url, email.body)
        self.assertIn("Cordialement,\nL’équipe Gestion Immobilière", email.body)

        # Vérifier que le montant n'apparaît qu'une seule fois dans le texte
        self.assertEqual(email.body.count("450 000 Ar"), 1)

        # Vérifications sur le HTML
        self.assertTrue(bool(email.alternatives))
        html_body = email.alternatives[0][0]
        self.assertIn("Bonjour Rakoto Be,", html_body)
        self.assertIn("Votre paiement a été validé avec succès.", html_body)
        self.assertIn("Montant : 450 000 Ar", html_body)
        self.assertIn("Date du paiement : 17 novembre 2026", html_body)
        self.assertIn("Contrat concerné : Studio de luxe", html_body)
        self.assertIn(f'href="{expected_url}"', html_body)
        self.assertIn("Télécharger la quittance PDF", html_body)
        self.assertEqual(html_body.count("450 000 Ar"), 1)

    def test_paiement_valide_email_depuis_quittance_identifiants_differents(self):
        from paiement.models import Quittance

        # Locataire 1
        user1 = Utilisateur.objects.create_user(
            email="loc1.diff@test.com", password="pwd", nom="Randria", prenoms="Soa", role=Utilisateur.Role.LOCATAIRE
        )
        loc1 = Locataire.objects.create(user=user1)
        bien1 = Bien.objects.create(
            proprietaire=self.prop, titre="Bien 3", adresse="Antananarivo", loyer_mensuel=300000,
            type="APPARTEMENT", mode_transaction="LOCATION", surface=35, nombre_pieces=1
        )
        contrat1 = Contrat.objects.create(
            bien=bien1, locataire=loc1, type_contrat="LOCATION", loyer=300000, depot_garantie=300000,
            date_debut=datetime.date(2026, 11, 1), date_fin=datetime.date(2027, 10, 31)
        )
        paiement1 = Paiement.objects.filter(contrat=contrat1).first()
        if not paiement1:
            paiement1 = Paiement.objects.create(
                contrat=contrat1, num_echeance=1, date_echeance=datetime.date(2026, 11, 17),
                date_paiement=datetime.date(2026, 11, 17), montant_attendu=300000.00, montant=300000.00,
                statut=Paiement.StatutPaiement.PAYE
            )
        else:
            paiement1.date_paiement = datetime.date(2026, 11, 17)
            paiement1.montant = 300000.00
            paiement1.statut = Paiement.StatutPaiement.PAYE
            paiement1.save()

        # Quittance 1 avec ID=10 associé au Paiement 1 (id != 10)
        quittance1 = Quittance(id=10, paiement=paiement1)
        self.assertNotEqual(quittance1.id, paiement1.pk)

        # Locataire 2
        user2 = Utilisateur.objects.create_user(
            email="loc2.diff@test.com", password="pwd", nom="Rasoa", prenoms="Fara", role=Utilisateur.Role.LOCATAIRE
        )
        loc2 = Locataire.objects.create(user=user2)
        bien2 = Bien.objects.create(
            proprietaire=self.prop, titre="Bien 42", adresse="Tamatave", loyer_mensuel=420000,
            type="APPARTEMENT", mode_transaction="LOCATION", surface=45, nombre_pieces=2
        )
        contrat2 = Contrat.objects.create(
            bien=bien2, locataire=loc2, type_contrat="LOCATION", loyer=420000, depot_garantie=420000,
            date_debut=datetime.date(2026, 11, 1), date_fin=datetime.date(2027, 10, 31)
        )
        paiement2 = Paiement.objects.filter(contrat=contrat2).first()
        if not paiement2:
            paiement2 = Paiement.objects.create(
                contrat=contrat2, num_echeance=1, date_echeance=datetime.date(2026, 11, 17),
                date_paiement=datetime.date(2026, 11, 17), montant_attendu=420000.00, montant=420000.00,
                statut=Paiement.StatutPaiement.PAYE
            )
        else:
            paiement2.date_paiement = datetime.date(2026, 11, 17)
            paiement2.montant = 420000.00
            paiement2.statut = Paiement.StatutPaiement.PAYE
            paiement2.save()

        # Quittance 2 avec ID=99 associé au Paiement 2 (id != 99)
        quittance2 = Quittance(id=99, paiement=paiement2)
        self.assertNotEqual(quittance2.id, paiement2.pk)

        # 1. Envoi depuis l'objet Quittance 1 - Test avec URL sans barre oblique finale
        mail.outbox.clear()
        with self.settings(BACKEND_PUBLIC_URL="https://api.immoconnect.mg"):
            NotificationService.notifier_paiement_valide(quittance1)

        email1 = [e for e in mail.outbox if user1.email in e.to][0]
        expected_url1 = f"https://api.immoconnect.mg/api/paiements/{paiement1.pk}/quittance/"
        # L'URL doit contenir la clé primaire du paiement concerné (et non l'id de la quittance)
        self.assertIn(expected_url1, email1.body)
        self.assertNotIn(f"/api/paiements/{quittance1.id}/quittance/", email1.body)
        self.assertIn(f'href="{expected_url1}"', email1.alternatives[0][0])
        self.assertIn("Montant : 300 000 Ar", email1.body)
        self.assertEqual(email1.body.count("300 000 Ar"), 1)

        # 2. Envoi depuis l'objet Quittance 2 - Test avec URL avec barre oblique finale
        mail.outbox.clear()
        with self.settings(BACKEND_PUBLIC_URL="https://api.immoconnect.mg/"):
            NotificationService.notifier_paiement_valide(quittance2)

        email2 = [e for e in mail.outbox if user2.email in e.to][0]
        expected_url2 = f"https://api.immoconnect.mg/api/paiements/{paiement2.pk}/quittance/"
        # L'URL doit se terminer par /api/paiements/{paiement_id}/quittance/ sans double barre oblique
        self.assertIn(expected_url2, email2.body)
        self.assertNotIn("//api/paiements/", email2.body)
        self.assertNotIn(f"/api/paiements/{quittance2.id}/quittance/", email2.body)
        self.assertIn(f'href="{expected_url2}"', email2.alternatives[0][0])
        self.assertIn("Montant : 420 000 Ar", email2.body)
        self.assertEqual(email2.body.count("420 000 Ar"), 1)

    def test_backend_public_url_production_validation(self):
        from django.core.exceptions import ImproperlyConfigured
        from notifications.services import get_public_backend_url

        # En production (DEBUG=False) :
        # A. URL absente ou vide -> ImproperlyConfigured
        with self.settings(DEBUG=False, BACKEND_PUBLIC_URL=""):
            with self.assertRaises(ImproperlyConfigured) as ctx:
                get_public_backend_url(enforce_production=True)
            self.assertIn("BACKEND_PUBLIC_URL", str(ctx.exception))

        # B. URL en clair (HTTP) au lieu de HTTPS -> ImproperlyConfigured
        with self.settings(DEBUG=False, BACKEND_PUBLIC_URL="http://api.immoconnect.mg"):
            with self.assertRaises(ImproperlyConfigured) as ctx:
                get_public_backend_url(enforce_production=True)
            self.assertIn("HTTPS", str(ctx.exception))

        # C. URL invalide sans hôte -> ImproperlyConfigured
        with self.settings(DEBUG=False, BACKEND_PUBLIC_URL="https://"):
            with self.assertRaises(ImproperlyConfigured):
                get_public_backend_url(enforce_production=True)

        # D. URL HTTPS absolue valide (avec et sans slash final)
        with self.settings(DEBUG=False, BACKEND_PUBLIC_URL="https://api.immoconnect.mg"):
            self.assertEqual(get_public_backend_url(enforce_production=True), "https://api.immoconnect.mg")

        with self.settings(DEBUG=False, BACKEND_PUBLIC_URL="https://api.immoconnect.mg/"):
            self.assertEqual(get_public_backend_url(enforce_production=True), "https://api.immoconnect.mg")

    def test_command_echeance_proche(self):
        today = timezone.now().date()
        date_dans_5j = today + datetime.timedelta(days=5)
        date_autre = today + datetime.timedelta(days=10)
        
        contrat = Contrat.objects.create(bien=self.bien, locataire=self.loc, type_contrat="LOCATION", loyer=500, depot_garantie=500, date_debut=today, date_fin=today + datetime.timedelta(days=365))
        p1 = Paiement.objects.create(contrat=contrat, num_echeance=99, date_echeance=date_dans_5j, montant_attendu=500, montant=500)
        p2 = Paiement.objects.create(contrat=contrat, num_echeance=100, date_echeance=date_autre, montant_attendu=500, montant=500)
        
        call_command('verifier_echeances')
        notifs = Notification.objects.filter(type=Notification.Type.ECHEANCE_PROCHE)
        self.assertGreaterEqual(notifs.count(), 1)
        self.assertTrue(notifs.filter(lien=f"/paiements/{p1.id}").exists())
        self.assertGreaterEqual(len(mail.outbox), 1)
        
        initial_count = Notification.objects.filter(type=Notification.Type.ECHEANCE_PROCHE).count()
        call_command('verifier_echeances')
        self.assertEqual(Notification.objects.filter(type=Notification.Type.ECHEANCE_PROCHE).count(), initial_count)

    def test_command_paiement_retard(self):
        today = timezone.now().date()
        date_retard = today - datetime.timedelta(days=5)
        date_retard_recent = today - datetime.timedelta(days=3)
        
        contrat = Contrat.objects.create(bien=self.bien, locataire=self.loc, type_contrat="LOCATION", loyer=500, depot_garantie=500, date_debut=today - datetime.timedelta(days=10), date_fin=today + datetime.timedelta(days=365))
        Paiement.objects.filter(contrat=contrat).delete()

        p1 = Paiement.objects.create(contrat=contrat, num_echeance=1, date_echeance=date_retard, montant_attendu=500, montant=500, statut=Paiement.StatutPaiement.EN_RETARD)
        p2 = Paiement.objects.create(contrat=contrat, num_echeance=2, date_echeance=date_retard_recent, montant_attendu=500, montant=500, statut=Paiement.StatutPaiement.EN_RETARD)
        
        call_command('verifier_echeances')
        notifs = Notification.objects.filter(type=Notification.Type.PAIEMENT_EN_RETARD)
        self.assertEqual(notifs.count(), 2)
        liens = list(notifs.values_list('lien', flat=True))
        self.assertIn(f"/paiements/{p1.id}", liens)
        self.assertIn(f"/paiements/{p2.id}", liens)
        self.assertGreaterEqual(len(mail.outbox), 2)
        
        call_command('verifier_echeances')
        self.assertEqual(Notification.objects.filter(type=Notification.Type.PAIEMENT_EN_RETARD).count(), 2)

    def test_utilisateur_sans_email(self):
        user_no_email = Utilisateur.objects.create_user(email="no@email.com", password="pwd", nom="Sans", role=Utilisateur.Role.LOCATAIRE)
        user_no_email.email = ""
        user_no_email.save()
        mail.outbox.clear()
        
        NotificationService.envoyer(
            utilisateur=user_no_email,
            type_notif=Notification.Type.AUTRE,
            titre="Test sans email",
            message="No email"
        )
        self.assertEqual(Notification.objects.filter(titre="Test sans email").count(), 1)
        self.assertEqual(len(mail.outbox), 0)

    def test_notification_lue(self):
        notif = Notification.objects.create(utilisateur=self.locataire_user, type=Notification.Type.AUTRE, message="Test lu")
        self.assertFalse(notif.lu)
        notif.lu = True
        notif.save()
        self.assertTrue(notif.lu)

    def test_erreur_email_n_empeche_pas_creation(self):
        with patch('notifications.services.send_mail', side_effect=Exception("Erreur SMTP")):
            notif = NotificationService.envoyer(
                utilisateur=self.locataire_user,
                type_notif=Notification.Type.AUTRE,
                titre="Test erreur email",
                message="Erreur"
            )
        self.assertIsNotNone(notif.id)
        self.assertFalse(notif.email_envoye)


# 2. Tests du Modèle Notification

class NotificationModelTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = create_user("model_notif@test.com")

    def test_str_representation(self):
        notif = create_notification(self.user, type_notif="CONTRAT_CREE", titre="Contrat signé")
        str_repr = str(notif)
        self.assertIsInstance(str_repr, str)
        self.assertGreater(len(str_repr), 0)

    def test_default_lu_is_false(self):
        notif = Notification.objects.create(
            utilisateur=self.user, type="AUTRE", titre="Défaut", message="Message"
        )
        self.assertFalse(notif.lu)

    def test_default_email_envoye_is_false(self):
        notif = Notification.objects.create(
            utilisateur=self.user, type="AUTRE", titre="Défaut email", message="Message"
        )
        self.assertFalse(notif.email_envoye)

    def test_date_creation_auto_set(self):
        notif = create_notification(self.user)
        self.assertIsNotNone(notif.date_creation)

    def test_notification_with_lien(self):
        notif = Notification.objects.create(
            utilisateur=self.user, type="AUTRE", titre="Avec lien",
            message="Message", lien="/contracts/1/"
        )
        self.assertEqual(notif.lien, "/contracts/1/")

    def test_type_choices_display(self):
        notif = create_notification(self.user, type_notif="PAIEMENT_VALIDE")
        self.assertEqual(notif.get_type_display(), "Paiement validé")


# 3. Tests des Vues API Notifications

class NotificationListViewTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = create_user("list@test.com")
        cls.n1 = create_notification(cls.user, type_notif="AUTRE", titre="N1", lu=False)
        cls.n2 = create_notification(cls.user, type_notif="CONTRAT_CREE", titre="N2", lu=False)
        cls.n3 = create_notification(cls.user, type_notif="PAIEMENT_VALIDE", titre="N3", lu=True)

    def setUp(self):
        self.client.force_authenticate(user=self.user)
        self.url = reverse("notification-list")

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_all_notifications(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 3)

    def test_filter_unread_notifications(self):
        response = self.client.get(self.url, {"lu": "false"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for notif in response.data["results"]:
            self.assertFalse(notif["lu"])

    def test_filter_read_notifications(self):
        response = self.client.get(self.url, {"lu": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for notif in response.data["results"]:
            self.assertTrue(notif["lu"])

    def test_filter_by_type_autre(self):
        response = self.client.get(self.url, {"type": "AUTRE"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for notif in response.data["results"]:
            self.assertEqual(notif["type"], "AUTRE")

    def test_filter_by_type_contrat_cree(self):
        response = self.client.get(self.url, {"type": "CONTRAT_CREE"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for notif in response.data["results"]:
            self.assertEqual(notif["type"], "CONTRAT_CREE")

    def test_user_only_sees_own_notifications(self):
        other_user = create_user("other@test.com")
        other_notif = create_notification(other_user, titre="Notification autre user")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids_retournes = [notif["id"] for notif in response.data["results"]]
        self.assertIn(self.n1.id, ids_retournes)
        self.assertNotIn(other_notif.id, ids_retournes)


class NotificationCountViewTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = create_user("count@test.com")

    def setUp(self):
        self.client.force_authenticate(user=self.user)
        self.url = reverse("notification-count")

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_count_zero_when_no_notifications(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_count_unread_notifications(self):
        create_notification(self.user, lu=False)
        create_notification(self.user, lu=False)
        create_notification(self.user, lu=True)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_count_decreases_after_marking_read(self):
        n = create_notification(self.user, lu=False)
        response = self.client.get(self.url)
        initial_count = response.data["count"]
        n.lu = True
        n.save()
        response = self.client.get(self.url)
        self.assertEqual(response.data["count"], initial_count - 1)


class NotificationDetailViewTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = create_user("detail@test.com")

    def setUp(self):
        self.client.force_authenticate(user=self.user)
        self.notif = create_notification(self.user, titre="Détail test", lu=False)
        self.url = reverse("notification-detail", kwargs={"pk": self.notif.pk})

    def test_get_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_detail_marks_as_read(self):
        self.assertFalse(self.notif.lu)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.lu)

    def test_get_detail_returns_correct_data(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["id"], self.notif.id)
        self.assertEqual(response.data["data"]["titre"], "Détail test")

    def test_get_detail_not_found_returns_404(self):
        url_404 = reverse("notification-detail", kwargs={"pk": 99999})
        response = self.client.get(url_404)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_notification(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(pk=self.notif.pk).exists())

    def test_delete_notification_not_found_returns_404(self):
        url_404 = reverse("notification-detail", kwargs={"pk": 99999})
        response = self.client.delete(url_404)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_access_other_user_notification(self):
        other_user = create_user("other_detail@test.com")
        other_notif = create_notification(other_user, titre="Notif privée")
        url_other = reverse("notification-detail", kwargs={"pk": other_notif.pk})
        response = self.client.get(url_other)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_already_read_notification_stays_read(self):
        self.notif.lu = True
        self.notif.save()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.lu)


class MarquerLuViewTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = create_user("marquer@test.com")

    def setUp(self):
        self.client.force_authenticate(user=self.user)
        self.url = reverse("notification-marquer-lu")
        self.n1 = create_notification(self.user, titre="M1", lu=False)
        self.n2 = create_notification(self.user, titre="M2", lu=False)
        self.n3 = create_notification(self.user, titre="M3", lu=False)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_specific_ids_as_read(self):
        response = self.client.post(
            self.url, {"notification_ids": [self.n1.id, self.n2.id]}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.n1.refresh_from_db()
        self.n2.refresh_from_db()
        self.n3.refresh_from_db()
        self.assertTrue(self.n1.lu)
        self.assertTrue(self.n2.lu)
        self.assertFalse(self.n3.lu)

    def test_mark_all_as_read_when_ids_empty_list(self):
        response = self.client.post(self.url, {"notification_ids": []}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for n in [self.n1, self.n2, self.n3]:
            n.refresh_from_db()
            self.assertTrue(n.lu)

    def test_mark_all_as_read_when_body_empty(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for n in [self.n1, self.n2, self.n3]:
            n.refresh_from_db()
            self.assertTrue(n.lu)

    def test_response_contains_count(self):
        response = self.client.post(self.url, {"notification_ids": [self.n1.id]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertEqual(response.data["count"], 1)


class NotificationCreateViewTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = create_user("admin_create@test.com", role="ADMIN")
        cls.agent = create_user("agent_create@test.com", role="AGENT")
        cls.proprietaire = create_user("proprio_create@test.com", role="PROPRIETAIRE")
        cls.locataire = create_user("locataire_create@test.com", role="LOCATAIRE")

    def setUp(self):
        self.url = reverse("notification-create")
        self.valid_payload = {
            "utilisateur": self.locataire.pk,
            "type": "AUTRE",
            "titre": "Nouvelle notification",
            "message": "Ceci est un message de test.",
        }

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_create_notification(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])

    def test_agent_cannot_create_notification(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_proprietaire_cannot_create_notification(self):
        self.client.force_authenticate(user=self.proprietaire)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_locataire_cannot_create_notification(self):
        self.client.force_authenticate(user=self.locataire)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_missing_message_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        payload = {k: v for k, v in self.valid_payload.items() if k != "message"}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_type_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        payload = {**self.valid_payload, "type": "TYPE_INEXISTANT"}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_utilisateur_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        payload = {**self.valid_payload, "utilisateur": 99999}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_create_all_valid_types(self):
        self.client.force_authenticate(user=self.admin)
        valid_types = [
            "CONTRAT_CREE", "PAIEMENT_VALIDE", "ECHEANCE_PROCHE",
            "PAIEMENT_EN_RETARD", "NOUVELLE_RESERVATION", "AUTRE",
        ]
        for notif_type in valid_types:
            payload = {**self.valid_payload, "type": notif_type, "titre": f"Test {notif_type}"}
            response = self.client.post(self.url, payload, format="json")
            self.assertEqual(
                response.status_code, status.HTTP_201_CREATED,
                msg=f"Création échouée pour le type {notif_type}",
            )
