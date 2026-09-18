"""Permissions du module Reservation.

Matrice de droits :

    Rôle                | Lecture         | Création | Mise à jour (répondre)
    --------------------|-----------------|----------|------------------------
    ADMIN / AGENT       | Toutes          | Non      | Oui
    LOCATAIRE           | Les siennes     | Oui      | Non
"""

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from utilisateur.models import Utilisateur

ROLES_GESTION = {Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT}


class ReservationPermission(permissions.BasePermission):
    """Lecture ouverte aux authentifiés ; création réservée au LOCATAIRE ;
    mise à jour réservée à ADMIN/AGENT."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        # Création : uniquement LOCATAIRE
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
