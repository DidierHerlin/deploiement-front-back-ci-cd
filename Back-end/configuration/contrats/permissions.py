from typing import Any
from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView
from common.permissions import ROLES_GESTION, EstGestionnaireOuLectureSeule

# Rôles autorisés à créer/modifier/supprimer un contrat.
ROLES_GESTION_CONTRAT = ROLES_GESTION


class ContratPermission(EstGestionnaireOuLectureSeule):
    @staticmethod
    def _peut_ecrire(request: Request) -> bool:
        """Lecture autorisée à tous ; écriture réservée à ADMIN/AGENT."""
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role in ROLES_GESTION_CONTRAT)
