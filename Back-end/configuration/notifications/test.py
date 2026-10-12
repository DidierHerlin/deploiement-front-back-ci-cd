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


# ==============================================================================
# Helpers
# ==============================================================================

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


# ==============================================================================
# 1. Tests des Services de Notification & Commandes Management
# ==============================================================================

class NotificationServiceTests(TestCase):
    def setUp(self):
        self.locataire_user = Utilisateur.objects.create_user(email="loc@test.com", password="pwd", nom="L", role=Utilisateur.Role.LOCATAIRE)
        self.locataire_user2 = Utilisateur.objects.create_user(email="loc2@test.com", password="pwd", nom="L2", role=Utilisateur.Role.LOCATAIRE)
        self.prop_user = Utilisateur.objects.create_user(email="prop@test.com", password="pwd", nom="P", role=Utilisateur.Role.PROPRIETAIRE)
        self.loc = Locataire.objects.create(user=self.locataire_user)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.bien = Bien.objects.create(proprietaire=self.prop, titre="Appartement", adresse="Test", loyer_mensuel=500, type="APPARTEMENT", mode_transaction="LOCATION", surface=50, nombre_pieces=2)

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


# ==============================================================================
# 2. Tests du Modèle Notification
# ==============================================================================

class NotificationModelTest(APITestCase):
    def setUp(self):
        self.user = create_user("model_notif@test.com")

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


# ==============================================================================
# 3. Tests des Vues API Notifications
# ==============================================================================

class NotificationListViewTest(APITestCase):
    def setUp(self):
        self.user = create_user("list@test.com")
        self.client.force_authenticate(user=self.user)
        self.url = reverse("notification-list")
        self.n1 = create_notification(self.user, type_notif="AUTRE", titre="N1", lu=False)
        self.n2 = create_notification(self.user, type_notif="CONTRAT_CREE", titre="N2", lu=False)
        self.n3 = create_notification(self.user, type_notif="PAIEMENT_VALIDE", titre="N3", lu=True)

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
    def setUp(self):
        self.user = create_user("count@test.com")
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
    def setUp(self):
        self.user = create_user("detail@test.com")
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
    def setUp(self):
        self.user = create_user("marquer@test.com")
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
    def setUp(self):
        self.admin = create_user("admin_create@test.com", role="ADMIN")
        self.agent = create_user("agent_create@test.com", role="AGENT")
        self.proprietaire = create_user("proprio_create@test.com", role="PROPRIETAIRE")
        self.locataire = create_user("locataire_create@test.com", role="LOCATAIRE")
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
