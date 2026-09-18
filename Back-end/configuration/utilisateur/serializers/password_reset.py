import secrets
from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from ..models import Utilisateur
from ..services import send_password_reset_email


# ===================================================================
# RÉINITIALISATION DE MOT DE PASSE PAR CODE (email + code à 6 chiffres)
#    Utilise les champs reset_token / reset_token_expiration du modèle.
# ===================================================================
DUREE_VALIDITE_CODE = timedelta(minutes=15)


class PasswordResetRequestSerializer(serializers.Serializer):

    email = serializers.EmailField()

    def validate_email(self, value):
        if not Utilisateur.objects.filter(email__iexact=value, is_active=True).exists():
            raise serializers.ValidationError("Aucun compte actif trouvé avec cet email.")
        return value

    def save(self, **kwargs):
        email = self.validated_data["email"]
        user = Utilisateur.objects.get(email__iexact=email)

        code = f"{secrets.randbelow(1000000):06d}"
        user.reset_token = code
        user.reset_token_expiration = timezone.now() + DUREE_VALIDITE_CODE
        user.save(update_fields=["reset_token", "reset_token_expiration"])

        duree_minutes = int(DUREE_VALIDITE_CODE.total_seconds() // 60)
        send_password_reset_email(user, code, duree_minutes)
        return user


class PasswordResetCodeVerificationSerializer(serializers.Serializer):

    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        try:
            user = Utilisateur.objects.get(email__iexact=attrs["email"])
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError("Code ou email invalide.")

        if user.reset_token != attrs["code"]:
            raise serializers.ValidationError("Code invalide.")

        if not user.reset_token_expiration or user.reset_token_expiration < timezone.now():
            raise serializers.ValidationError("Ce code a expiré, veuillez en demander un nouveau.")

        attrs["user"] = user
        return attrs


class PasswordResetConfirmSerializer(serializers.Serializer):

    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        try:
            user = Utilisateur.objects.get(email__iexact=attrs["email"])
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError("Code ou email invalide.")

        if user.reset_token != attrs["code"]:
            raise serializers.ValidationError("Code invalide.")

        if not user.reset_token_expiration or user.reset_token_expiration < timezone.now():
            raise serializers.ValidationError("Ce code a expiré, veuillez en demander un nouveau.")

        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        # Invalider le code après usage (usage unique)
        user.reset_token = None
        user.reset_token_expiration = None
        user.save()
        return user
