from rest_framework import permissions
from common.permissions import ROLES_GESTION
from utilisateur.models import Utilisateur


class PaiementPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        return user.role in ROLES_GESTION

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role in ROLES_GESTION:
            return True

        if request.method not in permissions.SAFE_METHODS:
            return False

        if user.role == Utilisateur.Role.LOCATAIRE:
            return obj.contrat.locataire.user == user

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            return obj.contrat.bien.proprietaire.user == user

        return False


class DemandePaiementPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if user.role in ROLES_GESTION:
            return True

        if user.role == Utilisateur.Role.LOCATAIRE:
            if request.method in permissions.SAFE_METHODS:
                return True
            if request.method == "POST":
                return True
            return False

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            return request.method in permissions.SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role in ROLES_GESTION:
            return True

        if user.role == Utilisateur.Role.LOCATAIRE:
            if obj.locataire.user != user:
                return False
            if request.method in permissions.SAFE_METHODS:
                return True
            if getattr(view, "action", None) == "annuler":
                return True
            return False

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            return (
                request.method in permissions.SAFE_METHODS
                and obj.facture.contrat.bien.proprietaire.user == user
            )

        return False
