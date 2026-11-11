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

    @classmethod
    def notifier_contrat_cree(cls, contrat):
        """Notifie le locataire et le propriétaire de la création d'un contrat."""
        destinataires = []
        if contrat.locataire and contrat.locataire.user:
            destinataires.append(contrat.locataire.user)
        if contrat.bien and contrat.bien.proprietaire and contrat.bien.proprietaire.user:
            destinataires.append(contrat.bien.proprietaire.user)

        for u in destinataires:
            cls.envoyer(
                utilisateur=u,
                type_notif=Notification.Type.CONTRAT_CREE,
                titre=f"Nouveau contrat pour {contrat.bien.titre}",
                message=f"Un nouveau contrat a été créé pour le bien '{contrat.bien.titre}'.",
                lien=f"/contrats/{contrat.id}",
                contexte_email={"contrat": contrat, "bien": contrat.bien}
            )

    @classmethod
    def notifier_paiement_cree(cls, paiement):
        """Notifie le locataire de la création d'un paiement / échéance."""
        from common.utils import formater_montant_ar
        if paiement.contrat and paiement.contrat.locataire and paiement.contrat.locataire.user:
            cls.envoyer(
                utilisateur=paiement.contrat.locataire.user,
                type_notif=Notification.Type.AUTRE,
                titre=f"Nouveau paiement ajouté pour {paiement.contrat.bien.titre}",
                message=f"Un nouveau paiement de {formater_montant_ar(paiement.montant_attendu or 0)} Ar a été généré.",
                lien=f"/paiements/{paiement.id}",
                contexte_email={"paiement": paiement}
            )

    @classmethod
    def notifier_paiement_valide(cls, paiement):
        """Notifie les parties de la validation d'un paiement."""
        from common.utils import formater_montant_ar
        destinataires = []
        if paiement.contrat and paiement.contrat.locataire and paiement.contrat.locataire.user:
            destinataires.append(paiement.contrat.locataire.user)
        if paiement.contrat and paiement.contrat.bien and paiement.contrat.bien.proprietaire and paiement.contrat.bien.proprietaire.user:
            destinataires.append(paiement.contrat.bien.proprietaire.user)

        for u in destinataires:
            cls.envoyer(
                utilisateur=u,
                type_notif=Notification.Type.PAIEMENT_VALIDE,
                titre=f"Paiement validé pour le contrat {paiement.contrat.bien.titre}",
                message=f"Le paiement de {formater_montant_ar(paiement.montant or 0)} Ar pour {paiement.contrat.bien.titre} a été validé.",
                lien=f"/api/paiements/{paiement.id}/quittance/",
                contexte_email={"paiement": paiement}
            )

    @classmethod
    def notifier_nouvelle_reservation(cls, reservation):
        """Notifie les administrateurs et agents d'une nouvelle réservation."""
        from utilisateur.models import Utilisateur
        nom_locataire = reservation.locataire.user.get_full_name()
        titre_bien = reservation.bien.titre
        message = (
            f"Nouvelle réservation soumise par {nom_locataire} "
            f"pour le bien « {titre_bien} » "
            f"(type : {reservation.get_type_reservation_display()})."
        )
        destinataires = Utilisateur.objects.filter(
            role__in=[Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT],
            is_active=True,
        )
        for user in destinataires:
            cls.envoyer(
                utilisateur=user,
                type_notif=Notification.Type.NOUVELLE_RESERVATION,
                titre="Nouvelle réservation",
                message=message,
                lien=f"/reservations/{reservation.id}"
            )

