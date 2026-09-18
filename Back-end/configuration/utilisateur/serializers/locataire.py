from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from ..models import Locataire, Utilisateur
from .utilisateur import UtilisateurSerializer, UtilisateurSimpleSerializer


# ===================================================================
# LOCATAIRE SERIALIZER (imbriqué, sur le modèle de l'ancien ScolariteSerializer)
# ===================================================================
class LocataireSerializer(serializers.ModelSerializer):
    user = UtilisateurSerializer(read_only=True)

    email = serializers.EmailField(write_only=True)
    nom = serializers.CharField(write_only=True)
    prenoms = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    telephone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    photo_profil = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Locataire
        fields = [
            "id", "user", "piece_identite", "contact",
            # champs de création
            "email", "nom", "prenoms", "password", "telephone", "photo_profil",
        ]

    def create(self, validated_data):
        email = validated_data.pop("email")
        nom = validated_data.pop("nom")
        prenoms = validated_data.pop("prenoms")
        password = validated_data.pop("password")
        telephone = validated_data.pop("telephone", "")
        photo_profil = validated_data.pop("photo_profil", None)

        # RG : un locataire est activé automatiquement à l'inscription (ROLES_AUTO_ACTIFS)
        user = Utilisateur.objects.create_user(
            email=email,
            password=password,
            nom=nom,
            prenoms=prenoms,
            role=Utilisateur.Role.LOCATAIRE,
            telephone=telephone,
            photo_profil=photo_profil,
        )

        locataire = Locataire.objects.create(user=user, **validated_data)
        return locataire

    def update(self, instance, validated_data):
        instance.piece_identite = validated_data.get("piece_identite", instance.piece_identite)
        instance.contact = validated_data.get("contact", instance.contact)
        instance.save()

        user = instance.user
        user.nom = validated_data.get("nom", user.nom)
        user.prenoms = validated_data.get("prenoms", user.prenoms)
        user.email = validated_data.get("email", user.email)
        user.telephone = validated_data.get("telephone", user.telephone)

        if "password" in validated_data:
            user.set_password(validated_data["password"])
        if "photo_profil" in validated_data:
            user.photo_profil = validated_data["photo_profil"]

        user.save()
        return instance


class LocataireSimpleSerializer(serializers.ModelSerializer):

    user = UtilisateurSimpleSerializer(read_only=True)

    class Meta:
        model = Locataire
        fields = ["id", "user", "contact"]
