from .auth import LoginView, LogoutView
from .locataires import LocataireDetailView, LocataireListView
from .password_reset import (
    RequestPasswordResetView,
    ResetPasswordView,
    VerifyResetCodeView,
)
from .profile import (
    ChangePasswordView,
    DeleteProfilePhotoView,
    GetProfileView,
    UpdateProfilePhotoView,
    UpdateUserProfileView,
)
from .proprietaires import (
    ActiverCompteView,
    ProprietaireDetailView,
    ProprietaireListView,
)
from .registration import (
    AgentRegisterView,
    LocataireRegisterView,
    ProprietaireRegisterView,
)
from .users import UtilisateurListView, UtilisateurDetailView

__all__ = [
    "ActiverCompteView",
    "AgentRegisterView",
    "ChangePasswordView",
    "DeleteProfilePhotoView",
    "GetProfileView",
    "LocataireDetailView",
    "LocataireListView",
    "LocataireRegisterView",
    "LoginView",
    "LogoutView",
    "ProprietaireDetailView",
    "ProprietaireListView",
    "ProprietaireRegisterView",
    "RequestPasswordResetView",
    "ResetPasswordView",
    "UpdateProfilePhotoView",
    "UpdateUserProfileView",
    "VerifyResetCodeView",
    "UtilisateurListView",
    "UtilisateurDetailView",
]
