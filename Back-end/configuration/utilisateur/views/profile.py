import logging

from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import (
    UpdateProfilePhotoSerializer,
    UtilisateurSerializer,
    UtilisateurUpdateSerializer,
)
from .mixins import ApiResponseMixin

logger = logging.getLogger(__name__)


# ===================================================================
# GESTION PROFIL UTILISATEUR (générique, tous rôles)
# ===================================================================

class GetProfileView(ApiResponseMixin, APIView):
    """Récupérer ou modifier le profil de l'utilisateur connecté"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UtilisateurSerializer(request.user, context={"request": request})
        return Response({
            "success": True,
            "user": serializer.data,
        }, status=status.HTTP_200_OK)
        
    def put(self, request):
        return self._update_profile(request)
        
    def patch(self, request):
        return self._update_profile(request)
        
    def _update_profile(self, request):
        serializer = UtilisateurUpdateSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            try:
                user = serializer.save()

                return Response({
                    "success": True,
                    "message": "Profil mis à jour avec succès",
                    "user": UtilisateurSerializer(user, context={"request": request}).data,
                }, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Erreur mise à jour profil: {str(e)}")
                return self.error_response(
                    "Erreur lors de la mise à jour",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return self.error_response("Données invalides", details=serializer.errors)


class UpdateUserProfileView(ApiResponseMixin, APIView):
    """Mise à jour complète du profil utilisateur"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser,JSONParser]

    def put(self, request):
        serializer = UtilisateurUpdateSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            try:
                user = serializer.save()

                return Response({
                    "success": True,
                    "message": "Profil mis à jour avec succès",
                    "user": UtilisateurSerializer(user, context={"request": request}).data,
                }, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Erreur mise à jour profil: {str(e)}")
                return self.error_response(
                    "Erreur lors de la mise à jour",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return self.error_response("Données invalides", details=serializer.errors)


class UpdateProfilePhotoView(ApiResponseMixin, APIView):
    """Mise à jour de la photo de profil uniquement"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = UpdateProfilePhotoSerializer(data=request.data)

        if serializer.is_valid():
            try:
                user = request.user

                if user.photo_profil:
                    user.photo_profil.delete(save=False)

                user.photo_profil = serializer.validated_data["photo_profil"]
                user.save()

                return Response({
                    "success": True,
                    "message": "Photo de profil mise à jour avec succès",
                    "user": UtilisateurSerializer(user, context={"request": request}).data,
                }, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Erreur mise à jour photo: {str(e)}")
                return self.error_response(
                    "Erreur lors de la mise à jour de la photo",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return self.error_response("Données invalides", details=serializer.errors)


class DeleteProfilePhotoView(ApiResponseMixin, APIView):
    """Suppression de la photo de profil"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user

        if not user.photo_profil:
            return self.error_response("Aucune photo de profil à supprimer")

        try:
            user.photo_profil.delete(save=True)
            return self.success_response("Photo de profil supprimée avec succès")

        except Exception as e:
            logger.error(f"Erreur suppression photo: {str(e)}")
            return self.error_response(
                "Erreur lors de la suppression de la photo",
                details=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChangePasswordView(ApiResponseMixin, APIView):
    """Changement de mot de passe (nécessite l'ancien mot de passe)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not current_password or not new_password:
            return self.error_response("Mot de passe actuel et nouveau mot de passe requis")

        serializer = UtilisateurUpdateSerializer(
            request.user,
            data={"current_password": current_password, "new_password": new_password},
            partial=True,
            context={"request": request},
        )

        if serializer.is_valid():
            try:
                serializer.save()

                logger.info(f"Mot de passe changé pour: {request.user.email}")

                return self.success_response("Mot de passe changé avec succès")

            except Exception as e:
                logger.error(f"Erreur changement mot de passe: {str(e)}")
                return self.error_response(
                    "Erreur lors du changement de mot de passe",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return self.error_response("Validation échouée", details=serializer.errors)
