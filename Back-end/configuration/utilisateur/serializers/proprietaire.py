from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from ..models import Proprietaire, Utilisateur
from .utilisateur import UtilisateurSerializer, UtilisateurSimpleSerializer


# ===================================================================
# PROPRIETAIRE SERIALIZER (imbriqué, sur le modèle de l'ancien EtudiantSerializer)
# ===================================================================
class ProprietaireSerializer(serializers.ModelSerializer):
    user = UtilisateurSerializer(read_only=True)

    # Champs write-only pour créer le compte Utilisateur en même temps que le profil
    email = serializers.EmailField(write_only=True)
    nom = serializers.CharField(write_only=True)
    prenoms = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    telephone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    photo_profil = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Proprietaire
        fields = [
            "id", "user", "iban", "contact",
            # champs de création
            "email", "nom", "prenoms", "password", "telephone", "photo_profil",
        ]

    def validate_iban(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("L'IBAN ne peut pas être vide.")
        return value.strip()

    def create(self, validated_data):
        email = validated_data.pop("email")
        nom = validated_data.pop("nom")
        prenoms = validated_data.pop("prenoms")
        password = validated_data.pop("password")
        telephone = validated_data.pop("telephone", "")
        photo_profil = validated_data.pop("photo_profil", None)

        user = Utilisateur.objects.create_user(
            email=email,
            password=password,
            nom=nom,
            prenoms=prenoms,
            role=Utilisateur.Role.PROPRIETAIRE,
            telephone=telephone,
            photo_profil=photo_profil,
        )

        proprietaire = Proprietaire.objects.create(user=user, **validated_data)
        return proprietaire

    def update(self, instance, validated_data):
        # Champs directs du profil propriétaire
        instance.iban = validated_data.get("iban", instance.iban)
        instance.contact = validated_data.get("contact", instance.contact)
        instance.save()

        # Mise à jour de l'utilisateur lié, si des données sont fournies
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


class ProprietaireSimpleSerializer(serializers.ModelSerializer):
    """Version simplifiée pour les listes (ex : filtre des biens par propriétaire)."""

    user = UtilisateurSimpleSerializer(read_only=True)

    class Meta:
        model = Proprietaire
        fields = ["id", "user", "iban", "contact"]
