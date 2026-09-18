from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from ..models import Utilisateur
from .mixins import PhotoUrlMixin


# ===================================================================
# 1. UTILISATEUR SERIALIZER (avec photo_url, comme l'ancien UserSerializer)
# ===================================================================
class UtilisateurSerializer(PhotoUrlMixin, serializers.ModelSerializer):
    """Profil complet : consultation et modification (y compris la photo)."""

    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            "id", "email", "nom", "prenoms",
            "role", "telephone",
            "photo_profil",  # champ d'upload (write)
            "photo_url",     # URL absolue pour l'affichage (read)
            "is_active", "date_creation",
        ]
        read_only_fields = ["id", "email", "role", "is_active", "date_creation"]
        extra_kwargs = {
            "photo_profil": {"required": False, "write_only": True},
        }
        # email et role : un utilisateur ne doit pas pouvoir se les
        # auto-modifier via /me/. Seul l'admin les change via le CRUD normal.


class UtilisateurSimpleSerializer(PhotoUrlMixin, serializers.ModelSerializer):
    """Version simplifiée pour les listes (ex : sélection d'un locataire dans un contrat)."""

    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = ["id", "email", "nom", "prenoms", "role", "photo_url"]


class UtilisateurCreateSerializer(serializers.ModelSerializer):
    """
    Création d'un compte (par l'administrateur — RG-01/02).

    `is_active` est en lecture seule : sa valeur est décidée par
    UtilisateurManager.create_user selon le rôle (voir ROLES_AUTO_ACTIFS),
    mais renvoyée dans la réponse pour indiquer si le compte est
    immédiatement actif (LOCATAIRE) ou en attente de validation
    (AGENT, PROPRIETAIRE — voir action `activer` du ViewSet).
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Utilisateur
        fields = [
            "id", "email", "nom", "prenoms",
            "role", "telephone", "password", "is_active",
        ]
        read_only_fields = ["id", "is_active"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = Utilisateur.objects.create_user(password=password, **validated_data)
        return user


# ===================================================================
# MISE À JOUR DE LA PHOTO DE PROFIL SEULE
# ===================================================================
class UpdateProfilePhotoSerializer(serializers.Serializer):
    """Mise à jour de la photo de profil uniquement."""

    photo_profil = serializers.ImageField(required=True)

    def validate_photo_profil(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("La taille de l'image ne doit pas dépasser 5 MB.")

        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Format d'image non supporté. Utilisez JPG, PNG ou GIF.")

        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.photo_profil = self.validated_data["photo_profil"]
        user.save(update_fields=["photo_profil"])
        return user


# ===================================================================
# MISE À JOUR DU PROFIL UTILISATEUR (avec changement de mot de passe sécurisé)
# ===================================================================
class UtilisateurUpdateSerializer(serializers.ModelSerializer):
    """
    Mise à jour du profil utilisateur : nom, prénoms, email, téléphone,
    photo de profil, et changement de mot de passe (avec vérification
    de l'ancien mot de passe).
    """

    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False, min_length=8)
    photo_profil = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Utilisateur
        fields = [
            "nom", "prenoms", "email", "telephone",
            "photo_profil", "current_password", "new_password",
        ]

    def validate(self, data):
        user = self.instance
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if new_password:
            if not current_password:
                raise serializers.ValidationError({
                    "current_password": "Vous devez fournir le mot de passe actuel pour changer de mot de passe."
                })

            if not check_password(current_password, user.password):
                raise serializers.ValidationError({
                    "current_password": "Le mot de passe actuel est incorrect."
                })

            try:
                validate_password(new_password, user)
            except DjangoValidationError as e:
                raise serializers.ValidationError({"new_password": list(e.messages)})

            data["password"] = make_password(new_password)

        return data

    def update(self, instance, validated_data):
        validated_data.pop("current_password", None)
        validated_data.pop("new_password", None)

        password = validated_data.pop("password", None)
        if password:
            instance.password = password

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
