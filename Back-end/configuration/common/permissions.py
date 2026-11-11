from rest_framework.permissions import BasePermission, SAFE_METHODS
from utilisateur.models import Utilisateur

ROLES_GESTION = {Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT}


class EstGestionnaire(BasePermission):
    """Accès réservé aux gestionnaires (ADMIN ou AGENT)."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ROLES_GESTION
        )


class EstGestionnaireOuLectureSeule(BasePermission):
    """Lecture (GET, HEAD, OPTIONS) pour tout utilisateur authentifié, écriture réservée à ADMIN / AGENT."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ROLES_GESTION

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ROLES_GESTION
