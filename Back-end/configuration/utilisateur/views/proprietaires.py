import logging

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Proprietaire, Utilisateur
from ..permissions import EstGestionnaire
from ..serializers import ProprietaireSerializer, UtilisateurSerializer
from .mixins import ApiResponseMixin

logger = logging.getLogger(__name__)


# ===================================================================
# GESTION PROFIL PROPRIÉTAIRE
# ===================================================================

class ProprietaireDetailView(ApiResponseMixin, APIView):
    """Détails et modification de la fiche propriétaire"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """
        GET /api/proprietaires/me/     → Profil du propriétaire connecté
        GET /api/proprietaires/<id>/   → Profil spécifique (agent/admin uniquement)
        """
        if pk:
            if not EstGestionnaire().has_permission(request, self):
                return self.error_response(
                    "Accès refusé. Réservé à l'agence.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            proprietaire = get_object_or_404(Proprietaire, pk=pk)
        else:
            try:
                proprietaire = Proprietaire.objects.get(user=request.user)
            except Proprietaire.DoesNotExist:
                if request.user.role in (Utilisateur.Role.AGENT, Utilisateur.Role.ADMIN):
                    return Response({
                        "success": True,
                        "message": "Vous êtes connecté en tant qu'agent/administrateur",
                        "user": UtilisateurSerializer(request.user, context={"request": request}).data,
                    }, status=status.HTTP_200_OK)
                return self.error_response(
                    "Fiche propriétaire non trouvée",
                    status_code=status.HTTP_404_NOT_FOUND,
                )

        # RG-09 : un propriétaire ne peut consulter que ses propres données
        if pk and request.user.role == Utilisateur.Role.PROPRIETAIRE:
            return self.error_response(
                "Accès refusé.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProprietaireSerializer(proprietaire, context={"request": request})
        return Response({
            "success": True,
            "data": serializer.data,
        }, status=status.HTTP_200_OK)

    def put(self, request, pk=None):
        """Mise à jour de la fiche (le propriétaire modifie son propre profil)."""
        try:
            proprietaire = Proprietaire.objects.get(user=request.user)
        except Proprietaire.DoesNotExist:
            return self.error_response(
                "Vous devez être propriétaire pour modifier ce profil",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if pk and str(proprietaire.pk) != str(pk):
            return self.error_response(
                "Vous ne pouvez modifier que votre propre profil",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProprietaireSerializer(
            proprietaire, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    proprietaire_updated = serializer.save()

                return self.success_response(
                    "Profil mis à jour avec succès",
                    data=ProprietaireSerializer(proprietaire_updated, context={"request": request}).data,
                )

            except Exception as e:
                logger.error(f"Erreur mise à jour propriétaire: {str(e)}")
                return self.error_response(
                    "Erreur lors de la mise à jour",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return self.error_response("Données invalides", details=serializer.errors)

    def delete(self, request, pk=None):
        """Suppression (agent/admin uniquement)."""
        if not EstGestionnaire().has_permission(request, self):
            return self.error_response(
                "Seule l'agence peut supprimer un propriétaire",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if not pk:
            return self.error_response("ID du propriétaire requis")

        proprietaire = get_object_or_404(Proprietaire, pk=pk)
        user = proprietaire.user

        try:
            with transaction.atomic():
                proprietaire.delete()
                user.is_active = False
                user.save(update_fields=["is_active"])

            logger.info(f"Propriétaire désactivé: {user.email}")

            return Response({
                "success": True,
                "message": "Propriétaire désactivé avec succès",
            }, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logger.error(f"Erreur suppression propriétaire: {str(e)}")
            return self.error_response(
                "Erreur lors de la suppression",
                details=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProprietaireListView(ApiResponseMixin, APIView):
    """Liste de tous les propriétaires (agent/admin uniquement)"""
    permission_classes = [IsAuthenticated, EstGestionnaire]

    def get(self, request):
        proprietaires = Proprietaire.objects.select_related("user").all()
        serializer = ProprietaireSerializer(proprietaires, many=True, context={"request": request})

        return Response({
            "success": True,
            "count": proprietaires.count(),
            "results": serializer.data,
        }, status=status.HTTP_200_OK)


class ActiverCompteView(ApiResponseMixin, APIView):
    """
    Activation manuelle d'un compte PROPRIETAIRE ou AGENT créé inactif
    (agent/admin uniquement).
    """
    permission_classes = [IsAuthenticated, EstGestionnaire]

    def post(self, request, pk=None):
        utilisateur = get_object_or_404(Utilisateur, pk=pk)

        if utilisateur.is_active:
            return self.error_response("Ce compte est déjà actif.")

        utilisateur.is_active = True
        utilisateur.save(update_fields=["is_active"])

        logger.info(f"Compte activé: {utilisateur.email}")

        return self.success_response("Compte activé avec succès.")
