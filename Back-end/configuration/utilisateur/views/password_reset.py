import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from ..serializers import (
    PasswordResetCodeVerificationSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)
from .mixins import ApiResponseMixin

logger = logging.getLogger(__name__)


# ===================================================================
# RÉINITIALISATION MOT DE PASSE (3 étapes, par code — cf. serializers)
# ===================================================================

class RequestPasswordResetView(ApiResponseMixin, APIView):
    """Étape 1 : Demande de réinitialisation - Envoie un code par email"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return self.error_response("Email invalide", details=serializer.errors)

        try:
            serializer.save()

            logger.info(f"Code de réinitialisation envoyé à: {serializer.validated_data['email']}")

            return self.success_response("Code envoyé par email avec succès")

        except Exception as e:
            logger.error(f"Erreur envoi email: {str(e)}")
            return self.error_response(
                "Erreur lors de l'envoi de l'email",
                details=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VerifyResetCodeView(ApiResponseMixin, APIView):
    """Étape 2 : Vérification du code"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetCodeVerificationSerializer(data=request.data)

        if not serializer.is_valid():
            return self.error_response(
                "Code ou email invalide",
                details=serializer.errors,
            )

        return self.success_response("Code valide")


class ResetPasswordView(ApiResponseMixin, APIView):
    """Étape 3 : Réinitialisation finale du mot de passe"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)

        if not serializer.is_valid():
            return self.error_response("Données invalides", details=serializer.errors)

        serializer.save()

        logger.info(f"Mot de passe réinitialisé pour: {serializer.validated_data['email']}")

        return self.success_response("Mot de passe réinitialisé avec succès")
