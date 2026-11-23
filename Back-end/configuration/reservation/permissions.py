from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from common.permissions import ROLES_GESTION
from utilisateur.models import Utilisateur


class ReservationPermission(permissions.BasePermission):
    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        # Création pour locataire seulement (les autres rôles ne peuvent pas créer de réservation)
        if request.method == "POST" and view.action == "create":
            return request.user.role == Utilisateur.Role.LOCATAIRE

        # Actions personnalisées (répondre) : ADMIN/AGENT
        if view.action == "repondre":
            return request.user.role in ROLES_GESTION

        # PUT/PATCH/DELETE classiques : ADMIN seulement
        if request.method in ("PUT", "PATCH", "DELETE"):
            return request.user.role in ROLES_GESTION

        return False

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        if request.method in permissions.SAFE_METHODS:
            # LOCATAIRE ne voit que les siennes (filtré dans get_queryset)
            return True
        if request.user.role in ROLES_GESTION:
            return True
        return False
