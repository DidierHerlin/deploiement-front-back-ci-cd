import logging
import os
import sys
import urllib.parse
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from notifications.models import Notification

logger = logging.getLogger(__name__)

def get_aws_backend_url():
    """Renvoie l'URL du serveur backend sur AWS (EC2/Production)."""
    raw_url = str(
        getattr(settings, "BACKEND_PUBLIC_URL", "") or os.getenv("BACKEND_PUBLIC_URL", "")
    ).strip()
    if raw_url and "localhost" not in raw_url and "127.0.0.1" not in raw_url:
        return raw_url.rstrip("/")

    aws_ip = str(
        getattr(settings, "AWS_EC2_IP", "")
        or os.getenv("AWS_EC2_IP", "")
        or getattr(settings, "EC2_PUBLIC_IP", "")
        or os.getenv("EC2_PUBLIC_IP", "")
        or "13.53.227.16"
    ).strip()
    return f"http://{aws_ip}:8000".rstrip("/")


def get_local_backend_url():
    """Renvoie l'URL du serveur backend en environnement local."""
    return "http://localhost:8000"


def get_public_backend_url(request=None, enforce_production=False):
    # 1. Détection dynamique à partir de la requête HTTP si fournie (ex: requête depuis AWS ou Local)
    if request is not None and hasattr(request, "get_host"):
        try:
            scheme = "https" if request.is_secure() else "http"
            host = request.get_host()
            if host:
                return f"{scheme}://{host}".rstrip("/")
        except Exception:
            pass

    raw_url = str(
        getattr(settings, "BACKEND_PUBLIC_URL", "") or os.getenv("BACKEND_PUBLIC_URL", "")
    ).strip()

    is_test = "test" in sys.argv or getattr(settings, "IS_TESTING", False)
    is_production = enforce_production or (not getattr(settings, "DEBUG", True) and not is_test)

    if not raw_url:
        if enforce_production:
            raise ImproperlyConfigured(
                "Le réglage Django BACKEND_PUBLIC_URL est obligatoire en production et doit être une URL HTTPS absolue."
            )
        if is_production:
            return get_aws_backend_url()
        # Valeur par défaut pour l'environnement local de développement / test
        raw_url = "http://localhost:8000"

    parsed = urllib.parse.urlparse(raw_url)

    if enforce_production:
        if parsed.scheme.lower() != "https" or not parsed.netloc:
            raise ImproperlyConfigured(
                f"Le réglage BACKEND_PUBLIC_URL doit être une URL HTTPS absolue valide avec un hôte "
                f"(valeur reçue : '{raw_url}')."
            )
    elif is_production:
        if parsed.scheme.lower() != "https":
            logger.warning(
                f"BACKEND_PUBLIC_URL ({raw_url}) utilise le protocole HTTP en production. "
                "Il est fortement recommandé de configurer HTTPS dès la mise en service du nom de domaine et du certificat TLS."
            )
        if not parsed.netloc:
            logger.error(f"BACKEND_PUBLIC_URL invalide sans hôte : '{raw_url}'")
            return get_aws_backend_url()
    else:
        if not parsed.scheme or not parsed.netloc:
            raise ImproperlyConfigured(
                f"Le réglage BACKEND_PUBLIC_URL doit être une URL absolue valide avec un hôte "
                f"(valeur reçue : '{raw_url}')."
            )

    return raw_url.rstrip("/")


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
        Évite le double enregistrement et le double envoi lors d'une tentative ou d'un rejeu.
        """
        # 1. Vérification d'idempotence pour éviter les doublons
        notification = None
        if lien and type_notif in (Notification.Type.PAIEMENT_VALIDE, Notification.Type.CONTRAT_CREE):
            notification = Notification.objects.filter(
                utilisateur=utilisateur,
                type=type_notif,
                lien=lien
            ).order_by("-date_creation").first()

        # Si déjà créé et email déjà envoyé avec succès, on évite le double envoi
        if notification and notification.email_envoye:
            logger.info(f"Notification {type_notif} déjà envoyée à {utilisateur.email} pour {lien}.")
            return notification

        # Création en DB si aucune notification existante
        if not notification:
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
            
        contexte = dict(contexte_email) if contexte_email else {}
        request_obj = contexte.get("request")
        try:
            raw_backend = get_public_backend_url(request=request_obj)
        except Exception as e:
            logger.warning(f"Impossible de déterminer BACKEND_PUBLIC_URL ({e}). Utilisation du chemin relatif.")
            raw_backend = ""

        aws_backend = get_aws_backend_url()
        local_backend = get_local_backend_url()

        raw_frontend = str(getattr(settings, "FRONTEND_URL", "http://localhost:3000")).split(",")[0].strip().rstrip("/")
        
        # Enrichissement automatique pour les paiements / quittances si non déjà fait
        quittance_obj = contexte.get("quittance")
        paiement_obj = contexte.get("paiement")
        if not paiement_obj and quittance_obj:
            paiement_obj = getattr(quittance_obj, "paiement", None)
            if paiement_obj:
                contexte["paiement"] = paiement_obj

        paiement_id = None
        if paiement_obj:
            paiement_id = getattr(paiement_obj, "pk", getattr(paiement_obj, "id", None))
        elif quittance_obj:
            paiement_id = getattr(quittance_obj, "paiement_id", None)

        if paiement_obj or quittance_obj:
            from common.utils import formater_montant_ar
            from django.utils import timezone
            if "montant_format" not in contexte and paiement_obj:
                contexte["montant_format"] = formater_montant_ar(getattr(paiement_obj, "montant", 0) or 0)
            if "date_paiement_format" not in contexte and paiement_obj:
                MOIS_FR = {
                    1: "janvier", 2: "février", 3: "mars", 4: "avril",
                    5: "mai", 6: "juin", 7: "juillet", 8: "août",
                    9: "septembre", 10: "octobre", 11: "novembre", 12: "décembre"
                }
                d = getattr(paiement_obj, "date_paiement", None) or getattr(paiement_obj, "date_echeance", None) or timezone.now().date()
                contexte["date_paiement_format"] = f"{d.day} {MOIS_FR.get(d.month, '')} {d.year}".strip()
            if "contrat_titre" not in contexte and paiement_obj:
                contrat = getattr(paiement_obj, "contrat", None)
                bien = getattr(contrat, "bien", None) if contrat else None
                contexte["contrat_titre"] = getattr(bien, "titre", "Contrat de bail") or "Contrat de bail"
            if "url_quittance" not in contexte and paiement_id:
                route_quittance = f"/api/paiements/{paiement_id}/quittance/"
                contexte["url_quittance"] = f"{raw_backend}{route_quittance}" if raw_backend else route_quittance
            if "url_quittance_aws" not in contexte and paiement_id:
                route_quittance = f"/api/paiements/{paiement_id}/quittance/"
                contexte["url_quittance_aws"] = f"{aws_backend}{route_quittance}"
            if "url_quittance_local" not in contexte and paiement_id:
                route_quittance = f"/api/paiements/{paiement_id}/quittance/"
                contexte["url_quittance_local"] = f"{local_backend}{route_quittance}"

        nom_dest = ""
        if utilisateur:
            if hasattr(utilisateur, "get_full_name"):
                nom_dest = (utilisateur.get_full_name() or "").strip()
            if not nom_dest:
                nom_parts = [getattr(utilisateur, "prenoms", ""), getattr(utilisateur, "nom", "")]
                nom_dest = " ".join(p for p in nom_parts if p).strip() or getattr(utilisateur, "email", "")

        contexte.update({
            "utilisateur": utilisateur,
            "destinataire_nom": nom_dest,
            "titre": titre,
            "message": message,
            "lien": lien,
            "type_notif": notification.get_type_display(),
            "backend_url": raw_backend,
            "frontend_url": raw_frontend,
        })
        if "url_quittance" not in contexte and lien:
            if lien.startswith("http"):
                contexte["url_quittance"] = lien
            elif raw_backend:
                formatted_lien = lien if lien.endswith("/") else f"{lien}/"
                contexte["url_quittance"] = f"{raw_backend}{formatted_lien}"
            else:
                contexte["url_quittance"] = lien
        
        template_name = cls.TEMPLATE_MAP.get(type_notif, cls.DEFAULT_TEMPLATE)
        
        try:
            html_message = render_to_string(template_name, contexte)
            
            # Version texte : si template .txt existe, on le rend, sinon strip_tags avec URL sur sa propre ligne
            text_template = template_name.replace(".html", ".txt")
            try:
                from django.template.loader import get_template
                get_template(text_template)
                plain_message = render_to_string(text_template, contexte)
            except Exception:
                plain_message = strip_tags(html_message)
                url_val = contexte.get("url_quittance")
                if url_val and url_val not in plain_message:
                    if "Télécharger la quittance PDF" in plain_message:
                        plain_message = plain_message.replace(
                            "Télécharger la quittance PDF",
                            f"Télécharger la quittance PDF\n{url_val}"
                        )
                    else:
                        plain_message += f"\n\n{url_val}"
            
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
    def notifier_paiement_valide(cls, paiement_ou_quittance, request=None):
        """
        Notifie les parties de la validation d'un paiement.
        Accepte soit un objet Paiement, soit un objet Quittance.
        Si un objet Quittance est fourni, l'identifiant du paiement est récupéré
        via sa relation avec le paiement (quittance.paiement).
        """
        from common.utils import formater_montant_ar
        from django.utils import timezone

        quittance = None
        if hasattr(paiement_ou_quittance, "paiement") and getattr(paiement_ou_quittance, "paiement", None):
            quittance = paiement_ou_quittance
            paiement = paiement_ou_quittance.paiement
        else:
            paiement = paiement_ou_quittance
            quittance = getattr(paiement, "quittance", None)

        paiement_id = getattr(paiement, "pk", getattr(paiement, "id", None))
        if not paiement_id and quittance:
            paiement_id = getattr(quittance, "paiement_id", None)

        montant_format = formater_montant_ar(getattr(paiement, "montant", 0) or 0)

        MOIS_FR = {
            1: "janvier", 2: "février", 3: "mars", 4: "avril",
            5: "mai", 6: "juin", 7: "juillet", 8: "août",
            9: "septembre", 10: "octobre", 11: "novembre", 12: "décembre"
        }
        date_ref = getattr(paiement, "date_paiement", None) or getattr(paiement, "date_echeance", None) or timezone.now().date()
        date_paiement_format = f"{date_ref.day} {MOIS_FR.get(date_ref.month, '')} {date_ref.year}".strip()

        contrat = getattr(paiement, "contrat", None)
        contrat_titre = ""
        if contrat and getattr(contrat, "bien", None):
            contrat_titre = getattr(contrat.bien, "titre", "Contrat de bail") or "Contrat de bail"
        else:
            contrat_titre = "Contrat de bail"

        try:
            from django.urls import reverse
            lien_quittance = reverse("paiement-quittance", args=[paiement_id])
        except Exception:
            lien_quittance = f"/api/paiements/{paiement_id}/quittance/"

        try:
            raw_backend = get_public_backend_url(request=request)
        except Exception as e:
            logger.warning(f"BACKEND_PUBLIC_URL indisponible: {e}")
            raw_backend = ""

        aws_backend = get_aws_backend_url()
        local_backend = get_local_backend_url()

        url_quittance = f"{raw_backend}{lien_quittance}" if raw_backend else lien_quittance
        url_quittance_aws = f"{aws_backend}{lien_quittance}"
        url_quittance_local = f"{local_backend}{lien_quittance}"

        destinataires = []
        if contrat and getattr(contrat, "locataire", None) and getattr(contrat.locataire, "user", None):
            destinataires.append(contrat.locataire.user)
        if (contrat and getattr(contrat, "bien", None) and getattr(contrat.bien, "proprietaire", None)
                and getattr(contrat.bien.proprietaire, "user", None)):
            destinataires.append(contrat.bien.proprietaire.user)

        for u in destinataires:
            try:
                cls.envoyer(
                    utilisateur=u,
                    type_notif=Notification.Type.PAIEMENT_VALIDE,
                    titre=f"Paiement validé pour le contrat {contrat_titre}",
                    message=f"Le paiement de {montant_format} Ar pour {contrat_titre} a été validé.",
                    lien=lien_quittance,
                    contexte_email={
                        "paiement": paiement,
                        "quittance": quittance,
                        "montant_format": montant_format,
                        "date_paiement_format": date_paiement_format,
                        "contrat_titre": contrat_titre,
                        "url_quittance": url_quittance,
                        "url_quittance_aws": url_quittance_aws,
                        "url_quittance_local": url_quittance_local,
                        "lien_quittance": lien_quittance,
                        "request": request,
                    }
                )
            except Exception as e:
                logger.error(f"Erreur d'envoi notification de validation à {u}: {e}", exc_info=True)

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

