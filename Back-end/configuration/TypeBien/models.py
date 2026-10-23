from django.db import models
class TypeBien(models.Model):
    designation = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="désignation",
    )

    class Meta:
        verbose_name = "Type de bien"
        verbose_name_plural = "Types de biens"
        ordering = ["designation"]

    def __str__(self):
        return self.designation

    def save(self, *args, **kwargs):
        if self.designation:
            self.designation = self.designation.strip()
        super().save(*args, **kwargs)
