from django.db import models
from common.models import BaseReferentielModel


class Status(BaseReferentielModel):
    name_field = "typeStatus"

    typeStatus = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="type de statut",
    )

    class Meta:
        verbose_name = "Statut"
        verbose_name_plural = "Statuts"
        ordering = ["typeStatus"]
