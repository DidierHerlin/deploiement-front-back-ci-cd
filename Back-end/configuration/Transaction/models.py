from django.db import models


class Transaction(models.Model):
    nomTransaction = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="nom de la transaction",
    )

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ["nomTransaction"]

    def __str__(self):
        return self.nomTransaction

    def save(self, *args, **kwargs):
        if self.nomTransaction:
            self.nomTransaction = self.nomTransaction.strip()
        super().save(*args, **kwargs)
