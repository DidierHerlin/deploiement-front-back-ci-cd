from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from django.core.exceptions import ValidationError as DjangoValidationError

if TYPE_CHECKING:
    # Import réservé à la vérification de types (mypy/pyright) : n'est
    # jamais exécuté à l'exécution, donc ne crée aucun import circulaire
    # avec models.py (qui importe ce module au niveau module).
    from django.db.models import QuerySet

    from .models import Contrat

__all__ = [
    "valider_dates_contrat",
    "valider_montant_positif",
    "valider_unicite_contrat_actif",
]


def valider_dates_contrat(date_debut: Optional[date], date_fin: Optional[date]) -> None:

    if date_debut is None or date_fin is None:
        return
    if date_fin <= date_debut:
        raise DjangoValidationError(
            "La date de fin doit être strictement postérieure à la date de début.",
            code="rg12_date_fin_invalide",
        )


def valider_montant_positif(valeur: Optional[Decimal], nom_champ: str = "Le montant") -> None:

    if valeur is not None and valeur < 0:
        raise DjangoValidationError(
            f"{nom_champ} ne peut pas être négatif.",
            code="montant_negatif",
        )


def valider_unicite_contrat_actif(
    bien_id: Optional[int],
    statut: str,
    contrat_pk: Optional[int] = None,
    *,
    queryset: "QuerySet[Contrat]",
) -> None:

    from .models import Contrat  # import différé : évite le cycle models.py <-> validators.py

    if statut != Contrat.Statut.ACTIF:
        return

    conflits = queryset.filter(bien_id=bien_id, statut=Contrat.Statut.ACTIF)
    if contrat_pk is not None:
        conflits = conflits.exclude(pk=contrat_pk)

    if conflits.exists():
        raise DjangoValidationError(
            "Ce bien possède déjà un contrat ACTIF en cours. "
            "Il doit être résilié ou terminé avant d'en créer un nouveau.",
            code="rg13_contrat_actif_existant",
        )