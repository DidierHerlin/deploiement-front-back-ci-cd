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
from ..throttling import PasswordResetRateThrottle

logger = logging.getLogger(__name__)


# Reinitialisation du mot de passe

class RequestPasswordResetView(ApiResponseMixin, APIView):
    """Étape 1 : Demande de réinitialisation - Envoie un code par email"""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)

        if not serializer.is_valid():
            error_msg = "Email invalide"
            if "email" in serializer.errors and serializer.errors["email"]:
                error_msg = str(serializer.errors["email"][0])
            elif "non_field_errors" in serializer.errors and serializer.errors["non_field_errors"]:
                error_msg = str(serializer.errors["non_field_errors"][0])
            return self.error_response(error_msg, details=serializer.errors)

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
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetCodeVerificationSerializer(data=request.data)

        if not serializer.is_valid():
            error_msg = "Code invalide ou expiré."
            if "non_field_errors" in serializer.errors and serializer.errors["non_field_errors"]:
                error_msg = str(serializer.errors["non_field_errors"][0])
            elif "code" in serializer.errors and serializer.errors["code"]:
                error_msg = str(serializer.errors["code"][0])
            elif "email" in serializer.errors and serializer.errors["email"]:
                error_msg = str(serializer.errors["email"][0])
            return self.error_response(
                error_msg,
                details=serializer.errors,
            )

        return self.success_response("Code vérifié", valid=True)


class ResetPasswordView(ApiResponseMixin, APIView):
    """Étape 3 : Réinitialisation finale du mot de passe"""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)

        if not serializer.is_valid():
            error_msg = "Données invalides"
            if "non_field_errors" in serializer.errors and serializer.errors["non_field_errors"]:
                error_msg = str(serializer.errors["non_field_errors"][0])
            elif "new_password" in serializer.errors and serializer.errors["new_password"]:
                error_msg = str(serializer.errors["new_password"][0])
            elif "password" in serializer.errors and serializer.errors["password"]:
                error_msg = str(serializer.errors["password"][0])
            elif "code" in serializer.errors and serializer.errors["code"]:
                error_msg = str(serializer.errors["code"][0])
            elif "email" in serializer.errors and serializer.errors["email"]:
                error_msg = str(serializer.errors["email"][0])
            return self.error_response(error_msg, details=serializer.errors)

        serializer.save()

        logger.info(f"Mot de passe réinitialisé pour: {serializer.validated_data['email']}")

        return self.success_response("Mot de passe réinitialisé avec succès")
