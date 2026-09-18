from rest_framework import status
from rest_framework.response import Response


class ApiResponseMixin:
    """Mixin pour standardiser les réponses API."""

    def success_response(self, message, data=None, status_code=status.HTTP_200_OK, **extra):
        payload = {"success": True, "message": message}
        if data is not None:
            payload["data"] = data
        payload.update(extra)
        return Response(payload, status=status_code)

    def error_response(self, error, details=None, status_code=status.HTTP_400_BAD_REQUEST):
        payload = {"success": False, "error": error}
        if details is not None:
            payload["details"] = details
        return Response(payload, status=status_code)
