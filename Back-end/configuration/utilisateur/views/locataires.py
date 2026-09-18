import logging

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Locataire, Utilisateur
from ..permissions import EstGestionnaire
from ..serializers import LocataireSerializer, UtilisateurSerializer
from .mixins import ApiResponseMixin

logger = logging.getLogger(__name__)


# ===================================================================
# GESTION PROFIL LOCATAIRE
# ===================================================================

class LocataireDetailView(ApiResponseMixin, APIView):
    """Détails et modification de la fiche locataire"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        """
        GET /api/locataires/me/     → Profil du locataire connecté
        GET /api/locataires/<id>/   → Profil spécifique (agent/admin uniquement)
        """
        if pk:
            if not EstGestionnaire().has_permission(request, self):
                return self.error_response(
                    "Accès refusé. Réservé à l'agence.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            locataire = get_object_or_404(Locataire, pk=pk)
        else:
            try:
                locataire = Locataire.objects.get(user=request.user)
            except Locataire.DoesNotExist:
                if request.user.role in (Utilisateur.Role.AGENT, Utilisateur.Role.ADMIN):
                    return Response({
                        "success": True,
                        "message": "Vous êtes connecté en tant qu'agent/administrateur",
                        "user": UtilisateurSerializer(request.user, context={"request": request}).data,
                    }, status=status.HTTP_200_OK)
                return self.error_response(
                    "Fiche locataire non trouvée",
                    status_code=status.HTTP_404_NOT_FOUND,
                )

        serializer = LocataireSerializer(locataire, context={"request": request})
        return Response({
            "success": True,
            "data": serializer.data,
        }, status=status.HTTP_200_OK)

    def put(self, request, pk=None):
        """Mise à jour de la fiche (le locataire modifie son propre profil)."""
        try:
            locataire = Locataire.objects.get(user=request.user)
        except Locataire.DoesNotExist:
            return self.error_response(
                "Vous devez être locataire pour modifier ce profil",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if pk and str(locataire.pk) != str(pk):
            return self.error_response(
                "Vous ne pouvez modifier que votre propre profil",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = LocataireSerializer(
            locataire, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    locataire_updated = serializer.save()

                return self.success_response(
                    "Profil mis à jour avec succès",
                    data=LocataireSerializer(locataire_updated, context={"request": request}).data,
                )

            except Exception as e:
                logger.error(f"Erreur mise à jour locataire: {str(e)}")
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
                "Seule l'agence peut supprimer un locataire",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if not pk:
            return self.error_response("ID du locataire requis")

        locataire = get_object_or_404(Locataire, pk=pk)
        user = locataire.user

        try:
            with transaction.atomic():
                locataire.delete()
                # RG-04 : désactivation logique plutôt que suppression physique
                user.is_active = False
                user.save(update_fields=["is_active"])

            logger.info(f"Locataire désactivé: {user.email}")

            return Response({
                "success": True,
                "message": "Locataire désactivé avec succès",
            }, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logger.error(f"Erreur suppression locataire: {str(e)}")
            return self.error_response(
                "Erreur lors de la suppression",
                details=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LocataireListView(ApiResponseMixin, APIView):
    """Liste de tous les locataires (agent/admin uniquement)"""
    permission_classes = [IsAuthenticated, EstGestionnaire]

    def get(self, request):
        locataires = Locataire.objects.select_related("user").all()
        serializer = LocataireSerializer(locataires, many=True, context={"request": request})

        return Response({
            "success": True,
            "count": locataires.count(),
            "results": serializer.data,
        }, status=status.HTTP_200_OK)
