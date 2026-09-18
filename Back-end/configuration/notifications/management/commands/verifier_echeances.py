from django.core.management.base import BaseCommand
from django.utils import timezone
from paiement.models import Paiement
from notifications.models import Notification
from notifications.services import NotificationService

class Command(BaseCommand):
    help = 'Vérifie quotidiennement les échéances et notifie les retards / échéances proches (idempotent).'

    def handle(self, *args, **options):
        today = timezone.now().date()
        date_dans_5_jours = today + timezone.timedelta(days=5)
        date_il_ya_5_jours = today - timezone.timedelta(days=5)

        # 1. Echéance dans 5 jours (Rappel)
        # On cherche les paiements avec statut EN_ATTENTE ou RETARD, avec echeance == aujourd'hui + 5
        paiements_proches = Paiement.objects.filter(
            statut__in=[Paiement.StatutPaiement.EN_ATTENTE, Paiement.StatutPaiement.EN_RETARD],
            date_echeance=date_dans_5_jours
        ).select_related("contrat__locataire__user")

        for paiement in paiements_proches:
            utilisateur = paiement.contrat.locataire.user if paiement.contrat and paiement.contrat.locataire else None
            if utilisateur:
                # Vérifier idempotence (pas de notif ECHEANCE_PROCHE dans les 10 derniers jours pour ce paiement/message précis)
                message_attendu = f"Échéance proche : {paiement.montant_attendu} € attendus le {paiement.date_echeance}"
                
                # Une meilleure idempotence : on utilise le `lien` qui pointe vers le paiement, et on check le type
                lien = f"/paiements/{paiement.id}"
                
                existe = Notification.objects.filter(
                    utilisateur=utilisateur,
                    type=Notification.Type.ECHEANCE_PROCHE,
                    lien=lien
                ).exists()
                
                if not existe:
                    NotificationService.envoyer(
                        utilisateur=utilisateur,
                        type_notif=Notification.Type.ECHEANCE_PROCHE,
                        titre=f"Rappel : Échéance proche pour le contrat {paiement.contrat.bien.titre}",
                        message="Rappel : votre paiement arrive à échéance dans 5 jours.",
                        lien=lien,
                        contexte_email={"paiement": paiement}
                    )
                    self.stdout.write(self.style.SUCCESS(f"Rappel envoyé pour le paiement {paiement.id}"))

        # 2. En retard depuis 5 jours
        # On cherche les paiements avec echeance == aujourd'hui - 5
        paiements_retard = Paiement.objects.filter(
            statut__in=[Paiement.StatutPaiement.EN_ATTENTE, Paiement.StatutPaiement.EN_RETARD],
            date_echeance__lt=today # Any payment overdue (not just 5 days)
        ).select_related("contrat__locataire__user")

        for paiement in paiements_retard:
            utilisateur = paiement.contrat.locataire.user if paiement.contrat and paiement.contrat.locataire else None
            if utilisateur:
                lien = f"/paiements/{paiement.id}"
                message_retard = "Votre paiement est en retard. Veuillez régulariser votre situation."
                
                # To avoid spamming every day, we check if a notification was already sent recently (e.g. last 7 days)
                # But to follow idempotence strictly, maybe just check if one exists at all for this payment
                existe = Notification.objects.filter(
                    utilisateur=utilisateur,
                    type=Notification.Type.PAIEMENT_EN_RETARD,
                    lien=lien
                ).exists()
                
                if not existe:
                    NotificationService.envoyer(
                        utilisateur=utilisateur,
                        type_notif=Notification.Type.PAIEMENT_EN_RETARD,
                        titre=f"Retard de paiement pour le contrat {paiement.contrat.bien.titre}",
                        message=message_retard,
                        lien=lien,
                        contexte_email={"paiement": paiement}
                    )
                    self.stdout.write(self.style.SUCCESS(f"Alerte retard envoyée pour le paiement {paiement.id}"))

        self.stdout.write(self.style.SUCCESS('Tâche de vérification des échéances terminée.'))
