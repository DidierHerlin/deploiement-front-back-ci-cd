from django.conf import settings
from django.core.mail import send_mail


def send_password_reset_email(user, code, duree_minutes):
    """
    Envoie le code de réinitialisation de mot de passe par email.
    """
    send_mail(
        subject="Code de réinitialisation de votre mot de passe",
        message=(
            f"Votre code de réinitialisation est : {code}\n\n"
            f"Ce code expire dans {duree_minutes} minutes.\n"
            "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )
