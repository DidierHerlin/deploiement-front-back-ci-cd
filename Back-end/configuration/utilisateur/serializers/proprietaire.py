from rest_framework import serializers

from ..models import Proprietaire, Utilisateur
from .base_profile import BaseProfileSerializer
from .utilisateur import UtilisateurSimpleSerializer


class ProprietaireSerializer(BaseProfileSerializer):
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
        user = self.create_user_for_profile(validated_data, role=Utilisateur.Role.PROPRIETAIRE)
        proprietaire = Proprietaire.objects.create(user=user, **validated_data)
        return proprietaire

    def update(self, instance, validated_data):
        instance.iban = validated_data.get("iban", instance.iban)
        instance.contact = validated_data.get("contact", instance.contact)
        instance.save()

        self.update_user_fields(instance.user, validated_data)
        return instance


class ProprietaireSimpleSerializer(serializers.ModelSerializer):
    """Version simplifiée pour les listes (ex : filtre des biens par propriétaire)."""

    user = UtilisateurSimpleSerializer(read_only=True)

    class Meta:
        model = Proprietaire
        fields = ["id", "user", "iban", "contact"]
