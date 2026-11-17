import secrets
from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from ..models import Utilisateur
from ..services import send_password_reset_email


# Reinitialisation de mot de passe par code
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
    code = serializers.CharField(max_length=6, required=False, allow_blank=True)
    token = serializers.CharField(max_length=6, required=False, allow_blank=True)
    otp = serializers.CharField(max_length=6, required=False, allow_blank=True)

    def validate(self, attrs):
        code_val = (attrs.get("code") or attrs.get("token") or attrs.get("otp") or "").strip()
        if not code_val:
            raise serializers.ValidationError({"code": "Code invalide ou manquant."})

        attrs["code"] = code_val

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
    code = serializers.CharField(max_length=6, required=False, allow_blank=True)
    token = serializers.CharField(max_length=6, required=False, allow_blank=True)
    otp = serializers.CharField(max_length=6, required=False, allow_blank=True)

    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    nouveau_mot_de_passe = serializers.CharField(write_only=True, required=False, allow_blank=True)

    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirmation_mot_de_passe = serializers.CharField(write_only=True, required=False, allow_blank=True)
    mot_de_passe_confirmation = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def validate(self, attrs):
        code_val = (attrs.get("code") or attrs.get("token") or attrs.get("otp") or "").strip()
        if not code_val:
            raise serializers.ValidationError({"code": "Le code de vérification est requis."})
        attrs["code"] = code_val

        # Supporte indifféremment 'new_password', 'password' ou 'nouveau_mot_de_passe'
        new_pwd = (
            attrs.get("new_password")
            or attrs.get("password")
            or attrs.get("nouveau_mot_de_passe")
            or ""
        )
        if not new_pwd or len(new_pwd) < 8:
            raise serializers.ValidationError({"new_password": "Le mot de passe doit contenir au moins 8 caractères."})

        # Supporte indifféremment 'confirm_password', 'confirmation_mot_de_passe' ou 'mot_de_passe_confirmation'
        confirm_pwd = (
            attrs.get("confirm_password")
            or attrs.get("confirmation_mot_de_passe")
            or attrs.get("mot_de_passe_confirmation")
            or ""
        )
        if confirm_pwd and confirm_pwd != new_pwd:
            raise serializers.ValidationError({"confirm_password": "Les mots de passe ne correspondent pas."})

        try:
            validate_password(new_pwd)
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})

        attrs["new_password"] = new_pwd

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
