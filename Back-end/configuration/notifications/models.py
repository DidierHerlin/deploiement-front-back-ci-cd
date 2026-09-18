import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


class Notification(models.Model):
    """Table NOTIFICATION du MLD."""

    class Type(models.TextChoices):
        CONTRAT_CREE = "CONTRAT_CREE", "Contrat créé"
        PAIEMENT_VALIDE = "PAIEMENT_VALIDE", "Paiement validé"
        ECHEANCE_PROCHE = "ECHEANCE_PROCHE", "Échéance proche"
        PAIEMENT_EN_RETARD = "PAIEMENT_EN_RETARD", "Paiement en retard"
        NOUVELLE_RESERVATION = "NOUVELLE_RESERVATION", "Nouvelle réservation"
        AUTRE = "AUTRE", "Autre"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="utilisateur",
    )
    type = models.CharField(
        "type", max_length=30, choices=Type.choices, default=Type.AUTRE,
    )
    titre = models.CharField("titre", max_length=255, blank=True)
    message = models.TextField("message")
    lien = models.CharField("lien", max_length=500, blank=True, null=True)
    date_creation = models.DateTimeField("date de création", auto_now_add=True)
    lu = models.BooleanField("lu", default=False)
    email_envoye = models.BooleanField(
        "email envoyé",
        default=False,
        help_text="Indique si l'email associé à cette notification a été envoyé avec succès.",
    )

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-date_creation"]
        indexes = [
            models.Index(fields=["utilisateur", "lu"]),
        ]

    def __str__(self):
        return f"[{self.get_type_display()}] → {self.utilisateur.email} ({self.date_creation:%d/%m/%Y %H:%M})"