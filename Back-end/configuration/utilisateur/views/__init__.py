from .auth import LoginView, LogoutView
from .dashboards import (
    AdminDashboardView,
    AgentDashboardView,
    ProprietaireDashboardView,
    ProprietaireDashboardOptimizedView,
)
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
    SignUpView,
)
from .reporting import ReportingStatsView
from .users import UtilisateurDetailView, UtilisateurListView

__all__ = [
    "ActiverCompteView",
    "AdminDashboardView",
    "AgentDashboardView",
    "AgentRegisterView",
    "ChangePasswordView",
    "DeleteProfilePhotoView",
    "GetProfileView",
    "LocataireDetailView",
    "LocataireListView",
    "LocataireRegisterView",
    "LoginView",
    "LogoutView",
    "ProprietaireDashboardView",
    "ProprietaireDashboardOptimizedView",
    "ProprietaireDetailView",
    "ProprietaireListView",
    "ProprietaireRegisterView",
    "ReportingStatsView",
    "RequestPasswordResetView",
    "ResetPasswordView",
    "SignUpView",
    "UpdateProfilePhotoView",
    "UpdateUserProfileView",
    "VerifyResetCodeView",
    "UtilisateurListView",
    "UtilisateurDetailView",
]
