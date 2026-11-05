from rest_framework.throttling import AnonRateThrottle


class AuthAnonRateThrottle(AnonRateThrottle):
    """Limitation de debit pour les tentatives d'authentification et d'inscription."""

    scope = "auth"


class PasswordResetRateThrottle(AnonRateThrottle):

    scope = "password_reset"
