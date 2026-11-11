from rest_framework import status
from rest_framework.response import Response
from utilisateur.models import Utilisateur


class ApiResponseMixin:
    """Mixin standard pour uniformiser les réponses API dans toutes les applications."""

    def success_response(self, message=None, data=None, status_code=status.HTTP_200_OK, **extra):
        payload = {"success": True}
        if message is not None:
            payload["message"] = message
        if data is not None:
            payload["data"] = data
        payload.update(extra)
        return Response(payload, status=status_code)

    def error_response(self, error, details=None, status_code=status.HTTP_400_BAD_REQUEST):
        payload = {"success": False, "error": error}
        if details is not None:
            payload["details"] = details
        return Response(payload, status=status_code)


class RoleScopedQuerySetMixin:
    """
    Mixin de filtrage du QuerySet selon le rôle de l'utilisateur (ADMIN, AGENT, PROPRIETAIRE, LOCATAIRE).
    Paramétrable via owner_field et tenant_field.
    """
    owner_field: str | None = "proprietaire__user"
    tenant_field: str | None = "locataire__user"

    def filter_by_user_role(self, queryset):
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            return queryset.none()

        if user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return queryset

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            if self.owner_field:
                return queryset.filter(**{self.owner_field: user})
            return queryset.none()

        if user.role == Utilisateur.Role.LOCATAIRE:
            if self.tenant_field:
                return queryset.filter(**{self.tenant_field: user})
            return queryset.none()

        return queryset.none()
