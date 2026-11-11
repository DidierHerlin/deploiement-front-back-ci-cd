from rest_framework import serializers

from ..models import Locataire, Utilisateur
from .base_profile import BaseProfileSerializer
from .utilisateur import UtilisateurSimpleSerializer


class LocataireSerializer(BaseProfileSerializer):
    class Meta:
        model = Locataire
        fields = [
            "id", "user", "piece_identite", "contact",
            # champs de création
            "email", "nom", "prenoms", "password", "telephone", "photo_profil",
        ]

    def create(self, validated_data):
        user = self.create_user_for_profile(validated_data, role=Utilisateur.Role.LOCATAIRE)
        locataire = Locataire.objects.create(user=user, **validated_data)
        return locataire

    def update(self, instance, validated_data):
        instance.piece_identite = validated_data.get("piece_identite", instance.piece_identite)
        instance.contact = validated_data.get("contact", instance.contact)
        instance.save()

        self.update_user_fields(instance.user, validated_data)
        return instance


class LocataireSimpleSerializer(serializers.ModelSerializer):
    user = UtilisateurSimpleSerializer(read_only=True)

    class Meta:
        model = Locataire
        fields = ["id", "user", "contact"]
