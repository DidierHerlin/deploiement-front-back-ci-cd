"""
Validateurs réutilisables pour le module Contrat.

Ces fonctions sont volontairement indépendantes de Django REST Framework
et du modèle : elles sont appelées à la fois par Contrat.clean() (validation
au niveau modèle / admin / shell) et par ContratSerializer.validate()
(validation au niveau API), afin de ne jamais dupliquer la règle de gestion
à deux endroits différents.
"""

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
    """
    RG-12 : la date de fin doit être strictement postérieure à la date de début.
    Traduite en CHECK constraint SQL native (voir Contrat.Meta.constraints),
    mais revalidée ici pour renvoyer un message d'erreur clair côté
    application avant même d'atteindre la base de données.
    """
    if date_debut is None or date_fin is None:
        return
    if date_fin <= date_debut:
        raise DjangoValidationError(
            "La date de fin doit être strictement postérieure à la date de début.",
            code="rg12_date_fin_invalide",
        )


def valider_montant_positif(valeur: Optional[Decimal], nom_champ: str = "Le montant") -> None:
    """
    Contrainte générique de positivité (loyer >= 0, depot_garantie >= 0).
    """
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
    """
    RG-13 : un bien ne peut être associé qu'à un seul contrat ACTIF à la fois.

    Cette fonction fait la même vérification que l'index unique partiel
    posé en base (voir Contrat.Meta.constraints), mais permet de renvoyer
    une erreur de validation propre (400) plutôt qu'une IntegrityError (500)
    lorsque la requête passe par le serializer/formulaire.

    `queryset` est injecté par l'appelant plutôt que résolu ici via
    `Contrat.objects.all()`, afin que ce validateur reste testable de
    façon isolée (queryset filtré ou mocké en test) sans dépendre du
    manager par défaut. `Contrat` lui-même n'est importé qu'au moment de
    l'appel (voir ci-dessous), car un import en tête de fichier créerait
    un cycle avec models.py, qui importe ce module au niveau module.
    """
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