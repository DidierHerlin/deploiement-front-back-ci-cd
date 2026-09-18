from __future__ import annotations

from typing import Any

from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.request import Request
from rest_framework.views import APIView

from utilisateur.models import Utilisateur

ROLES_GESTION_COMPLETE = {Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT}

ROLES_GESTION_PARTIELLE = {Utilisateur.Role.PROPRIETAIRE}

ROLES_LECTURE_SEULE = {Utilisateur.Role.LOCATAIRE}

ROLES_AUTORISES_BIEN = ROLES_GESTION_COMPLETE | ROLES_GESTION_PARTIELLE | ROLES_LECTURE_SEULE


class PeutGererBien(BasePermission):
    message = "Vous n'avez pas les droits nécessaires sur ce bien."

    @staticmethod
    def _role(user: Any) -> Any:
        return getattr(user, "role", None)

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False

        role = self._role(user)
        if role not in ROLES_AUTORISES_BIEN:
            return False

        if role in ROLES_LECTURE_SEULE and request.method not in SAFE_METHODS:
            return False

        return True

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        user = request.user
        role = self._role(user)

        if role in ROLES_GESTION_COMPLETE:
            return True

        if role in ROLES_GESTION_PARTIELLE:
            proprietaire = getattr(user, "profil_proprietaire", None)
            est_proprietaire_du_bien = (
                proprietaire is not None and obj.proprietaire_id == proprietaire.pk
            )
            if est_proprietaire_du_bien:
                return True
            if request.method in SAFE_METHODS:
                return obj.statut == obj.StatutBien.DISPONIBLE
            return False

        if role in ROLES_LECTURE_SEULE:
            if request.method not in SAFE_METHODS:
                return False
            return obj.statut == obj.StatutBien.DISPONIBLE

        return False