from django.test import TestCase
from django.utils import timezone
from django.core.management import call_command
from django.core import mail
from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from notifications.models import Notification
from notifications.services import NotificationService
import datetime

class NotificationServiceTests(TestCase):
    def setUp(self):
        self.locataire_user = Utilisateur.objects.create_user(email="loc@test.com", password="pwd", nom="L", role=Utilisateur.Role.LOCATAIRE)
        self.locataire_user2 = Utilisateur.objects.create_user(email="loc2@test.com", password="pwd", nom="L2", role=Utilisateur.Role.LOCATAIRE)
        
        self.prop_user = Utilisateur.objects.create_user(email="prop@test.com", password="pwd", nom="P", role=Utilisateur.Role.PROPRIETAIRE)
        
        self.loc = Locataire.objects.create(user=self.locataire_user)
        self.prop = Proprietaire.objects.create(user=self.prop_user)
        
        self.bien = Bien.objects.create(proprietaire=self.prop, titre="Appartement", adresse="Test", loyer_mensuel=500, type="APPARTEMENT", mode_transaction="LOCATION", surface=50, nombre_pieces=2)
        
    def test_contrat_creation_notification(self):
        # Création de contrat -> notification
        contrat = Contrat.objects.create(bien=self.bien, locataire=self.loc, type_contrat="LOCATION", loyer=500, depot_garantie=500, date_debut=timezone.now().date(), date_fin=timezone.now().date() + datetime.timedelta(days=365))
        
        # Simuler perform_create behavior
        NotificationService.envoyer(
            utilisateur=self.locataire_user,
            type_notif=Notification.Type.CONTRAT_CREE,
            titre=f"Nouveau contrat",
            message=f"Contrat créé.",
            lien=f"/contrats/{contrat.id}",
            contexte_email={"contrat": contrat, "bien": contrat.bien}
        )
        
        self.assertEqual(Notification.objects.filter(type=Notification.Type.CONTRAT_CREE).count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Nouveau contrat", mail.outbox[0].subject)

    def test_paiement_valide_notification(self):
        contrat = Contrat.objects.create(bien=self.bien, locataire=self.loc, type_contrat="LOCATION", loyer=500, depot_garantie=500, date_debut=timezone.now().date(), date_fin=timezone.now().date() + datetime.timedelta(days=365))
        # Contrat creation might auto-generate a payment. Let's fetch it or create one with a different date if none exist.
        paiement = Paiement.objects.filter(contrat=contrat).first()
        if not paiement:
            paiement = Paiement.objects.create(contrat=contrat, num_echeance=1, date_echeance=timezone.now().date(), montant_attendu=500, montant=500, statut=Paiement.StatutPaiement.EN_ATTENTE)
        
        paiement.valider_paiement()
        
        # Simuler view valider()
        NotificationService.envoyer(
            utilisateur=self.locataire_user,
            type_notif=Notification.Type.PAIEMENT_VALIDE,
            titre="Paiement validé",
            message="Paiement ok",
            lien=f"/quittance/{paiement.id}",
            contexte_email={"paiement": paiement}
        )
        
        self.assertEqual(Notification.objects.filter(type=Notification.Type.PAIEMENT_VALIDE).count(), 1)
        # 1 pour la validation, plus éventuellement d'autres si des signaux en envoient
        self.assertGreaterEqual(len(mail.outbox), 1)
        
    def test_command_echeance_proche(self):
        today = timezone.now().date()
        date_dans_5j = today + datetime.timedelta(days=5)
        date_autre = today + datetime.timedelta(days=10)
        
        contrat = Contrat.objects.create(bien=self.bien, locataire=self.loc, type_contrat="LOCATION", loyer=500, depot_garantie=500, date_debut=today, date_fin=today + datetime.timedelta(days=365))
        p1 = Paiement.objects.create(contrat=contrat, num_echeance=99, date_echeance=date_dans_5j, montant_attendu=500, montant=500)
        p2 = Paiement.objects.create(contrat=contrat, num_echeance=100, date_echeance=date_autre, montant_attendu=500, montant=500)
        
        # Lancer la commande
        call_command('verifier_echeances')
        
        # Seulement p1 doit générer une notification ECHEANCE_PROCHE (ou d'autres auto-générés si échéance à 5j, mais peu probable avec date_debut=today)
        notifs = Notification.objects.filter(type=Notification.Type.ECHEANCE_PROCHE)
        self.assertGreaterEqual(notifs.count(), 1)
        self.assertTrue(notifs.filter(lien=f"/paiements/{p1.id}").exists())
        self.assertGreaterEqual(len(mail.outbox), 1)
        
        # Tester idempotence : relancer la commande ne crée pas de doublon
        initial_count = Notification.objects.filter(type=Notification.Type.ECHEANCE_PROCHE).count()
        call_command('verifier_echeances')
        self.assertEqual(Notification.objects.filter(type=Notification.Type.ECHEANCE_PROCHE).count(), initial_count)

    def test_command_paiement_retard(self):
        today = timezone.now().date()
        date_retard = today - datetime.timedelta(days=5)
        date_retard_recent = today - datetime.timedelta(days=3)
        
        contrat = Contrat.objects.create(bien=self.bien, locataire=self.loc, type_contrat="LOCATION", loyer=500, depot_garantie=500, date_debut=today - datetime.timedelta(days=10), date_fin=today + datetime.timedelta(days=365))
        
        # Modifier l'état des paiements auto-générés pour s'assurer qu'ils sont clairs ou les supprimer
        Paiement.objects.filter(contrat=contrat).delete()

        p1 = Paiement.objects.create(contrat=contrat, num_echeance=1, date_echeance=date_retard, montant_attendu=500, montant=500, statut=Paiement.StatutPaiement.EN_RETARD)
        p2 = Paiement.objects.create(contrat=contrat, num_echeance=2, date_echeance=date_retard_recent, montant_attendu=500, montant=500, statut=Paiement.StatutPaiement.EN_RETARD)
        
        call_command('verifier_echeances')
        
        notifs = Notification.objects.filter(type=Notification.Type.PAIEMENT_EN_RETARD)
        self.assertEqual(notifs.count(), 2)
        
        # Verify both payments triggered a notification
        liens = list(notifs.values_list('lien', flat=True))
        self.assertIn(f"/paiements/{p1.id}", liens)
        self.assertIn(f"/paiements/{p2.id}", liens)
        self.assertGreaterEqual(len(mail.outbox), 2)
        
        # Idempotence
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
        # Forcer une erreur send_mail
        from unittest.mock import patch
        
        with patch('notifications.services.send_mail', side_effect=Exception("Erreur SMTP")):
            notif = NotificationService.envoyer(
                utilisateur=self.locataire_user,
                type_notif=Notification.Type.AUTRE,
                titre="Test erreur email",
                message="Erreur"
            )
            
        # La notification est quand même créée
        self.assertIsNotNone(notif.id)
        # Mais l'email n'a pas été envoyé avec succès
        self.assertFalse(notif.email_envoye)
