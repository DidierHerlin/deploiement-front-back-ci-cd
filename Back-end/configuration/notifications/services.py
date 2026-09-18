import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from notifications.models import Notification

logger = logging.getLogger(__name__)

class NotificationService:
    
    TEMPLATE_MAP = {
        Notification.Type.CONTRAT_CREE: "notifications/emails/contrat_cree.html",
        Notification.Type.PAIEMENT_VALIDE: "notifications/emails/paiement_valide.html",
        Notification.Type.ECHEANCE_PROCHE: "notifications/emails/echeance_proche.html",
        Notification.Type.PAIEMENT_EN_RETARD: "notifications/emails/paiement_en_retard.html",
    }
    
    DEFAULT_TEMPLATE = "notifications/emails/defaut.html"

    @classmethod
    def envoyer(cls, utilisateur, type_notif, titre, message, lien=None, contexte_email=None):
        """
        Crée la notification en base et envoie l'email correspondant.
        """
        # Création en DB
        notification = Notification.objects.create(
            utilisateur=utilisateur,
            type=type_notif,
            titre=titre,
            message=message,
            lien=lien
        )
        
        # Préparation et envoi de l'email
        if not utilisateur.email:
            return notification
            
        contexte = contexte_email or {}
        contexte.update({
            "utilisateur": utilisateur,
            "titre": titre,
            "message": message,
            "lien": lien,
            "type_notif": notification.get_type_display(),
            "frontend_url": getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        })
        
        template_name = cls.TEMPLATE_MAP.get(type_notif, cls.DEFAULT_TEMPLATE)
        
        try:
            html_message = render_to_string(template_name, contexte)
            plain_message = strip_tags(html_message)
            
            nb_envoyes = send_mail(
                subject=f"[Gestion Immobilière] {titre}",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[utilisateur.email],
                html_message=html_message,
                fail_silently=False
            )
            
            if nb_envoyes > 0:
                notification.email_envoye = True
                notification.save(update_fields=["email_envoye"])
                
        except Exception as e:
            logger.error(f"Erreur d'envoi d'email de notification pour {utilisateur.email}: {e}")
            # L'opération principale réussit quand même (l'exception n'est pas levée).
            
        return notification
