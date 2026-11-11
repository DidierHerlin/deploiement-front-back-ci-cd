from django.db import models
from common.models import BaseReferentielModel


class TypeBien(BaseReferentielModel):
    name_field = "designation"

    designation = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="désignation",
    )

    class Meta:
        verbose_name = "Type de bien"
        verbose_name_plural = "Types de biens"
        ordering = ["designation"]
