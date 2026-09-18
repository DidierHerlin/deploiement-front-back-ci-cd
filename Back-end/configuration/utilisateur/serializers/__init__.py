from .auth import AgentRegisterSerializer, UtilisateurTokenObtainPairSerializer
from .locataire import LocataireSerializer, LocataireSimpleSerializer
from .mixins import PhotoUrlMixin
from .password_reset import (
    PasswordResetCodeVerificationSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)
from .proprietaire import ProprietaireSerializer, ProprietaireSimpleSerializer
from .utilisateur import (
    UpdateProfilePhotoSerializer,
    UtilisateurCreateSerializer,
    UtilisateurSerializer,
    UtilisateurSimpleSerializer,
    UtilisateurUpdateSerializer,
)

__all__ = [
    "AgentRegisterSerializer",
    "LocataireSerializer",
    "LocataireSimpleSerializer",
    "PasswordResetCodeVerificationSerializer",
    "PasswordResetConfirmSerializer",
    "PasswordResetRequestSerializer",
    "PhotoUrlMixin",
    "ProprietaireSerializer",
    "ProprietaireSimpleSerializer",
    "UpdateProfilePhotoSerializer",
    "UtilisateurCreateSerializer",
    "UtilisateurSerializer",
    "UtilisateurSimpleSerializer",
    "UtilisateurTokenObtainPairSerializer",
    "UtilisateurUpdateSerializer",
]
