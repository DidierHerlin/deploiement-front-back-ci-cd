import logging

from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from ..models import Proprietaire, Utilisateur
from ..permissions import EstGestionnaire
from ..serializers import ProprietaireSerializer
from .base_views import BaseProfileDetailView, BaseProfileListView
from .mixins import ApiResponseMixin

logger = logging.getLogger(__name__)


class ProprietaireDetailView(BaseProfileDetailView):
    serializer_class = ProprietaireSerializer
    model = Proprietaire
    profile_label = "propriétaire"
    role_type = Utilisateur.Role.PROPRIETAIRE


class ProprietaireListView(BaseProfileListView):
    """Liste de tous les propriétaires (agent/admin uniquement)"""
    serializer_class = ProprietaireSerializer
    model = Proprietaire


class ActiverCompteView(ApiResponseMixin, APIView):
    """
    Activation manuelle d'un compte PROPRIETAIRE ou AGENT créé inactif
    (agent/admin uniquement).
    """
    permission_classes = [IsAuthenticated, EstGestionnaire]

    @extend_schema(request=None, responses={200: dict})
    def post(self, request, pk=None):
        utilisateur = get_object_or_404(Utilisateur, pk=pk)

        if utilisateur.is_active:
            return self.error_response("Ce compte est déjà actif.")

        utilisateur.is_active = True
        utilisateur.save(update_fields=["is_active"])

        logger.info(f"Compte activé: {utilisateur.email}")

        return self.success_response("Compte activé avec succès.")
