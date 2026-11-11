import logging

from django.db import transaction
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from ..serializers import (
    AgentRegisterSerializer,
    LocataireSerializer,
    ProprietaireSerializer,
    UtilisateurSerializer,
)
from .mixins import ApiResponseMixin

logger = logging.getLogger(__name__)


class BaseRegisterView(ApiResponseMixin, APIView):
    """Vue de base pour l'inscription des utilisateurs."""
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    serializer_class = None
    output_serializer_class = None
    success_message = "Inscription réussie"
    role_name = "utilisateur"

    def handle_registration(self, request):
        logger.info(f"Tentative d'inscription {self.role_name}: {request.data.get('email')}")
        serializer = self.serializer_class(data=request.data, context={"request": request})

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    instance = serializer.save()

                email = getattr(instance, "email", getattr(getattr(instance, "user", None), "email", ""))
                logger.info(f"{self.role_name.capitalize()} créé avec succès: {email}")

                output_cls = self.output_serializer_class or self.serializer_class
                return self.success_response(
                    self.success_message,
                    data=output_cls(instance, context={"request": request}).data,
                    status_code=status.HTTP_201_CREATED,
                )

            except Exception as e:
                logger.error(f"Erreur lors de la création du {self.role_name}: {str(e)}")
                return self.error_response(
                    "Erreur lors de la création du compte",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        logger.warning(f"Validation {self.role_name} échouée: {serializer.errors}")
        return self.error_response("Données invalides", details=serializer.errors)

    def post(self, request, *args, **kwargs):
        return self.handle_registration(request)


class LocataireRegisterView(BaseRegisterView):
    """Inscription des locataires (activé automatiquement)."""
    serializer_class = LocataireSerializer
    role_name = "locataire"
    success_message = "Inscription réussie"


class ProprietaireRegisterView(BaseRegisterView):
    """Inscription des propriétaires (en attente de validation)."""
    serializer_class = ProprietaireSerializer
    role_name = "propriétaire"
    success_message = "Inscription enregistrée. Votre compte sera activé après validation par un agent."


class AgentRegisterView(BaseRegisterView):
    """Inscription des agents immobiliers (en attente de validation admin)."""
    serializer_class = AgentRegisterSerializer
    output_serializer_class = UtilisateurSerializer
    role_name = "agent"
    success_message = "Inscription enregistrée. Votre compte sera activé après validation par un administrateur."


class SignUpView(ApiResponseMixin, APIView):
    """Point d'entrée unifié pour l'inscription : POST /api/auth/signup/"""
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    REGISTRATION_HANDLERS = {
        "LOCATAIRE": LocataireRegisterView,
        "PROPRIETAIRE": ProprietaireRegisterView,
        "AGENT": AgentRegisterView,
    }

    def post(self, request, *args, **kwargs):
        role = request.data.get("role", "LOCATAIRE")
        if isinstance(role, str):
            role = role.strip().upper()

        handler_class = self.REGISTRATION_HANDLERS.get(role)
        if not handler_class:
            return self.error_response(
                f"Rôle invalide: '{role}'. Les rôles autorisés sont LOCATAIRE, PROPRIETAIRE, AGENT.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        handler = handler_class()
        return handler.handle_registration(request)
