"""Classes de permission DRF pour le module utilisateur."""
from rest_framework.permissions import BasePermission, SAFE_METHODS
from common.permissions import ROLES_GESTION, EstGestionnaire
from .models import Utilisateur


class EstAdmin(BasePermission):
    """RG-01 : seul l'administrateur gère certaines actions sensibles."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Utilisateur.Role.ADMIN
        )


class EstProprietaireDuCompte(BasePermission):
    """Un utilisateur ne peut modifier que son propre compte (sauf l'admin)."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == Utilisateur.Role.ADMIN:
            return True
        return obj == request.user


class EstProprietaireDuProfil(BasePermission):
    """Variante pour les objets Propriétaire / Locataire possédant un attribut `.user`."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == Utilisateur.Role.ADMIN:
            return True
        if request.method in SAFE_METHODS and request.user.role in ROLES_GESTION:
            return True
        return getattr(obj, "user", None) == request.user
