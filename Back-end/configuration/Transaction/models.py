from django.db import models
from common.models import BaseReferentielModel

#Model 
class Transaction(BaseReferentielModel):
    name_field = "nomTransaction"

    nomTransaction = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="nom de la transaction",
    )

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ["nomTransaction"]
