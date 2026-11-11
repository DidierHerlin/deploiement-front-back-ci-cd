from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from ..models import Utilisateur
from .utilisateur import UtilisateurSerializer


class BaseProfileSerializer(serializers.ModelSerializer):
    """
    Sérialiseur de base pour les profils liés à un Utilisateur (Locataire, Propriétaire).
    Centralise les champs d'enregistrement utilisateur et les méthodes d'aide à la création/mise à jour.
    """
    user = UtilisateurSerializer(read_only=True)

    email = serializers.EmailField(write_only=True)
    nom = serializers.CharField(write_only=True)
    prenoms = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    telephone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    photo_profil = serializers.ImageField(write_only=True, required=False)

    USER_WRITE_FIELDS = ["email", "nom", "prenoms", "password", "telephone", "photo_profil"]

    def create_user_for_profile(self, validated_data, role):
        email = validated_data.pop("email")
        nom = validated_data.pop("nom")
        prenoms = validated_data.pop("prenoms")
        password = validated_data.pop("password")
        telephone = validated_data.pop("telephone", "")
        photo_profil = validated_data.pop("photo_profil", None)

        return Utilisateur.objects.create_user(
            email=email,
            password=password,
            nom=nom,
            prenoms=prenoms,
            role=role,
            telephone=telephone,
            photo_profil=photo_profil,
        )

    def update_user_fields(self, user, validated_data):
        for field in ("nom", "prenoms", "email", "telephone"):
            if field in validated_data:
                setattr(user, field, validated_data[field])

        if "password" in validated_data:
            user.set_password(validated_data["password"])
        if "photo_profil" in validated_data:
            user.photo_profil = validated_data["photo_profil"]

        user.save()
        return user
