from django.db import models


class Status(models.Model):
    typeStatus = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="type de statut",
    )

    class Meta:
        verbose_name = "Statut"
        verbose_name_plural = "Statuts"
        ordering = ["typeStatus"]

    def __str__(self):
        return self.typeStatus

    def save(self, *args, **kwargs):
        if self.typeStatus:
            self.typeStatus = self.typeStatus.strip()
        super().save(*args, **kwargs)
