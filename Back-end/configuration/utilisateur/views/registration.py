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


# ===================================================================
# INSCRIPTION
# ===================================================================

class LocataireRegisterView(ApiResponseMixin, APIView):
    """
    Inscription des locataires.
    RG : un locataire est activé automatiquement (ROLES_AUTO_ACTIFS du manager).
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        logger.info(f"Tentative d'inscription locataire: {request.data.get('email')}")

        serializer = LocataireSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    locataire = serializer.save()

                logger.info(f"Locataire créé avec succès: {locataire.user.email}")

                return self.success_response(
                    "Inscription réussie",
                    data=LocataireSerializer(locataire, context={"request": request}).data,
                    status_code=status.HTTP_201_CREATED,
                )

            except Exception as e:
                logger.error(f"Erreur lors de la création du locataire: {str(e)}")
                return self.error_response(
                    "Erreur lors de la création du compte",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        logger.warning(f"Validation échouée: {serializer.errors}")
        return self.error_response("Données invalides", details=serializer.errors)


class ProprietaireRegisterView(ApiResponseMixin, APIView):
    """
    Inscription des propriétaires.
    RG : un compte PROPRIETAIRE est créé inactif et doit être validé par un
    administrateur ou un agent avant de pouvoir se connecter (voir manager).
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        logger.info(f"Tentative d'inscription propriétaire: {request.data.get('email')}")

        serializer = ProprietaireSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    proprietaire = serializer.save()

                logger.info(f"Propriétaire créé (en attente de validation): {proprietaire.user.email}")

                return self.success_response(
                    "Inscription enregistrée. Votre compte sera activé après validation par un agent.",
                    data=ProprietaireSerializer(proprietaire, context={"request": request}).data,
                    status_code=status.HTTP_201_CREATED,
                )

            except Exception as e:
                logger.error(f"Erreur lors de la création du propriétaire: {str(e)}")
                return self.error_response(
                    "Erreur lors de la création du compte",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        logger.warning(f"Validation propriétaire échouée: {serializer.errors}")
        return self.error_response("Données invalides", details=serializer.errors)


class AgentRegisterView(ApiResponseMixin, APIView):
    """
    Inscription des agents immobiliers.
    RG : un compte AGENT est créé inactif et doit être validé par un
    administrateur avant de pouvoir se connecter.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        logger.info(f"Tentative d'inscription agent: {request.data.get('email')}")

        serializer = AgentRegisterSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()

                logger.info(f"Agent créé (en attente de validation): {user.email}")

                return self.success_response(
                    "Inscription enregistrée. Votre compte sera activé après validation par un administrateur.",
                    data=UtilisateurSerializer(user, context={"request": request}).data,
                    status_code=status.HTTP_201_CREATED,
                )

            except Exception as e:
                logger.error(f"Erreur lors de la création de l'agent: {str(e)}")
                return self.error_response(
                    "Erreur lors de la création du compte",
                    details=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        logger.warning(f"Validation agent échouée: {serializer.errors}")
        return self.error_response("Données invalides", details=serializer.errors)
