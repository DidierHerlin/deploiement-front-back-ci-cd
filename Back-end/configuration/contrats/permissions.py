
from typing import Any

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from utilisateur.models import Utilisateur

# Rôles autorisés à créer/modifier/supprimer un contrat.
ROLES_GESTION_CONTRAT = {Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT}


class ContratPermission(permissions.BasePermission):
    """Lecture ouverte à tout utilisateur authentifié ; écriture réservée à ADMIN/AGENT."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        return self._peut_ecrire(request)

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        return self._peut_ecrire(request)

    @staticmethod
    def _peut_ecrire(request: Request) -> bool:
        """Lecture autorisée à tous ; écriture réservée à ADMIN/AGENT."""
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ROLES_GESTION_CONTRAT