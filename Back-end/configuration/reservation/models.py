"""Modèle Reservation — gestion des réservations de biens immobiliers."""

import logging

from django.core.exceptions import ValidationError
from django.db import models

from bien.models import Bien
from contrats.models import Contrat
from utilisateur.models import Locataire

logger = logging.getLogger(__name__)


class Reservation(models.Model):
    """Table RESERVATION du MLD."""

    class TypeReservation(models.TextChoices):
        LOCATION = "LOCATION", "Location"
        ACHAT = "ACHAT", "Achat"

    class StatutReservation(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        TRAITEE = "TRAITEE", "Traitée"
        ANNULEE = "ANNULEE", "Annulée"

    locataire = models.ForeignKey(
        Locataire,
        on_delete=models.PROTECT,
        related_name="reservations",
        verbose_name="locataire",
    )
    bien = models.ForeignKey(
        Bien,
        on_delete=models.PROTECT,
        related_name="reservations",
        verbose_name="bien concerné",
    )
    commentaire = models.TextField(
        "commentaire",
        blank=True,
        default="",
        help_text="Commentaire ou message du locataire.",
    )
    date_creation = models.DateTimeField("date de création", auto_now_add=True)
    type_reservation = models.CharField(
        "type de réservation",
        max_length=20,
        choices=TypeReservation.choices,
    )
    statut = models.CharField(
        "statut",
        max_length=20,
        choices=StatutReservation.choices,
        default=StatutReservation.EN_ATTENTE,
        db_index=True,
    )
    reponse_admin = models.TextField(
        "réponse de l'administrateur",
        blank=True,
        default="",
        help_text="Réponse de l'admin ou de l'agent immobilier au locataire.",
    )
    contrat = models.ForeignKey(
        Contrat,
        on_delete=models.SET_NULL,
        related_name="reservations",
        verbose_name="contrat associé",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "reservation"
        ordering = ["-date_creation"]
        verbose_name = "Réservation"
        verbose_name_plural = "Réservations"

    def __str__(self) -> str:
        return (
            f"Réservation #{self.pk} — {self.get_type_reservation_display()} "
            f"({self.get_statut_display()})"
        )

    def clean(self) -> None:
        super().clean()
        # Uniquement à la création
        if self.pk is None:
            self._valider_bien_disponible()
            self._valider_coherence_type()

    def _valider_bien_disponible(self) -> None:
        if self.bien_id and self.bien.statut != Bien.StatutBien.DISPONIBLE:
            raise ValidationError(
                {"bien": "Le bien n'est pas disponible pour une réservation."}
            )

    def _valider_coherence_type(self) -> None:
        if not self.bien_id:
            return
        if (
            self.type_reservation == self.TypeReservation.LOCATION
            and self.bien.mode_transaction != Bien.ModeTransaction.LOCATION
        ):
            raise ValidationError(
                {"type_reservation": "Ce bien n'est pas proposé à la location."}
            )
        if (
            self.type_reservation == self.TypeReservation.ACHAT
            and self.bien.mode_transaction != Bien.ModeTransaction.VENTE
        ):
            raise ValidationError(
                {"type_reservation": "Ce bien n'est pas proposé à la vente."}
            )

    def save(self, *args, **kwargs) -> None:
        is_creation = self.pk is None
        if is_creation:
            self.full_clean()
        super().save(*args, **kwargs)
        if is_creation:
            self._notifier_admin_et_agent()

    def _notifier_admin_et_agent(self) -> None:
        """Crée une notification pour chaque ADMIN et AGENT."""
        from django.conf import settings as django_settings
        from notifications.models import Notification
        from utilisateur.models import Utilisateur

        nom_locataire = self.locataire.user.get_full_name()
        titre_bien = self.bien.titre
        message = (
            f"Nouvelle réservation soumise par {nom_locataire} "
            f"pour le bien « {titre_bien} » "
            f"(type : {self.get_type_reservation_display()})."
        )

        destinataires = Utilisateur.objects.filter(
            role__in=[Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT],
            is_active=True,
        )

        notifications = []
        for user in destinataires:
            notifications.append(
                Notification(
                    utilisateur=user,
                    type="NOUVELLE_RESERVATION",
                    message=message,
                )
            )
        # bulk_create ne déclenche pas post_save, on crée un par un pour l'email
        for notif in notifications:
            notif.save()

        logger.info(
            "Notifications de réservation #%s envoyées à %d destinataire(s).",
            self.pk,
            len(notifications),
        )
