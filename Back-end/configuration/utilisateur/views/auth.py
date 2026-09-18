import logging

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView

from ..serializers import UtilisateurTokenObtainPairSerializer
from .mixins import ApiResponseMixin

logger = logging.getLogger(__name__)


# ===================================================================
# AUTHENTIFICATION JWT
# ===================================================================

class LoginView(TokenObtainPairView):
    """
    Connexion utilisateur — retourne un couple (access, refresh) de tokens JWT
    ainsi que le profil de l'utilisateur connecté.

    Utilise UtilisateurTokenObtainPairSerializer (déjà défini dans
    serializers.py), qui enrichit le payload du token avec le rôle et
    ajoute le profil utilisateur dans la réponse.

    RG-04 : un compte désactivé (is_active=False) ne peut plus se connecter —
    ce comportement est garanti nativement par TokenObtainPairSerializer,
    qui vérifie `user.is_active` avant d'émettre un token.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = UtilisateurTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({
                "success": False,
                "error": "Email ou mot de passe incorrect",
            }, status=status.HTTP_401_UNAUTHORIZED)

        data = serializer.validated_data
        return Response({
            "success": True,
            "message": "Connexion réussie",
            "access": str(data["access"]),
            "refresh": str(data["refresh"]),
            "user": data["utilisateur"],
        }, status=status.HTTP_200_OK)


class LogoutView(ApiResponseMixin, APIView):
    """
    Déconnexion utilisateur — blackliste le refresh token transmis
    (rest_framework_simplejwt.token_blacklist doit être dans INSTALLED_APPS).

    Le client doit envoyer son refresh token dans le corps de la requête :
        POST /api/auth/logout/
        { "refresh": "<refresh_token>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return self.error_response(
                "Le refresh token est requis pour la déconnexion",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return self.error_response(
                "Token invalide ou déjà expiré",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return self.success_response("Déconnexion réussie")
