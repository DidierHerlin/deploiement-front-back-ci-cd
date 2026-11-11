import logging

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Utilisateur
from ..permissions import EstGestionnaire
from ..serializers import UtilisateurSerializer
from .mixins import ApiResponseMixin

logger = logging.getLogger(__name__)


class BaseProfileListView(ApiResponseMixin, APIView):
    """Vue générique pour lister les profils (Locataires ou Propriétaires)."""
    model = None
    serializer_class = None
    permission_classes = [IsAuthenticated, EstGestionnaire]

    def get(self, request):
        instances = self.model.objects.select_related("user").all()
        serializer = self.serializer_class(instances, many=True, context={"request": request})
        return Response({
            "success": True,
            "count": instances.count(),
            "results": serializer.data,
        }, status=status.HTTP_200_OK)


class BaseProfileDetailView(ApiResponseMixin, APIView):
    """Vue générique pour la consultation, modification et suppression des profils."""
    model = None
    serializer_class = None
    profile_label = "profil"
    role_type = None
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            if not EstGestionnaire().has_permission(request, self):
                return self.error_response(
                    "Accès refusé. Réservé à l'agence.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            profile = get_object_or_404(self.model, pk=pk)
        else:
            try:
                profile = self.model.objects.get(user=request.user)
            except self.model.DoesNotExist:
                if request.user.role in (Utilisateur.Role.AGENT, Utilisateur.Role.ADMIN):
                    return Response({
                        "success": True,
                        "message": "Vous êtes connecté en tant qu'agent/administrateur",
                        "user": UtilisateurSerializer(request.user, context={"request": request}).data,
                    }, status=status.HTTP_200_OK)
                return self.error_response(
                    f"Fiche {self.profile_label} non trouvée",
                    status_code=status.HTTP_404_NOT_FOUND,
                )

        if pk and self.role_type and request.user.role == self.role_type:
            return self.error_response(
                "Accès refusé.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.serializer_class(profile, context={"request": request})
        return Response({
            "success": True,
            "data": serializer.data,
        }, status=status.HTTP_200_OK)

    def put(self, request, pk=None):
        try:
            profile = self.model.objects.get(user=request.user)
        except self.model.DoesNotExist:
            return self.error_response(
                f"Vous devez être {self.profile_label} pour modifier ce profil",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if pk and str(profile.pk) != str(pk):
            return self.error_response(
                "Vous ne pouvez modifier que votre propre profil",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.serializer_class(
            profile, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    profile_updated = serializer.save()

                return self.success_response(
                    "Profil mis à jour avec succès",
                    data=self.serializer_class(profile_updated, context={"request": request}).data,
                )

            except Exception as e:
                logger.error(f"Erreur mise à jour {self.profile_label}: {str(e)}")
                return self.error_response(
                    "Erreur lors de la mise à jour",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return self.error_response("Données invalides", details=serializer.errors)

    def delete(self, request, pk=None):
        if not EstGestionnaire().has_permission(request, self):
            return self.error_response(
                f"Seule l'agence peut supprimer un {self.profile_label}",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if not pk:
            return self.error_response(f"ID du {self.profile_label} requis")

        profile = get_object_or_404(self.model, pk=pk)
        user = profile.user

        try:
            with transaction.atomic():
                profile.delete()
                user.is_active = False
                user.save(update_fields=["is_active"])

            logger.info(f"{self.profile_label.capitalize()} désactivé: {user.email}")

            return Response({
                "success": True,
                "message": f"{self.profile_label.capitalize()} désactivé avec succès",
            }, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logger.error(f"Erreur suppression {self.profile_label}: {str(e)}")
            return self.error_response(
                "Erreur lors de la suppression",
                details=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
