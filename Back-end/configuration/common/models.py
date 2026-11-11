from django.db import models


class BaseReferentielModel(models.Model):
    """
    Modèle abstrait pour les référentiels simples (Status, Transaction, TypeBien).
    Permet de mutualiser le nettoyage des espaces sans altérer le schéma des tables en base de données.
    """
    name_field: str = ""

    class Meta:
        abstract = True

    def get_name_value(self) -> str:
        return getattr(self, self.name_field, "") or ""

    def __str__(self):
        return self.get_name_value()

    def save(self, *args, **kwargs):
        if self.name_field:
            val = getattr(self, self.name_field, None)
            if isinstance(val, str):
                setattr(self, self.name_field, val.strip())
        super().save(*args, **kwargs)
