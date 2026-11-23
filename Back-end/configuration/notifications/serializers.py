# immobilier/serializers.py

from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "utilisateur",
            "type",
            "type_display",
            "titre",
            "message",
            "lien",
            "date_creation",
            "lu",
            "email_envoye",
        ]
        read_only_fields = ["id", "utilisateur", "date_creation", "email_envoye"]


class NotificationCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification
        fields = ["utilisateur", "type", "titre", "message", "lien"]


class MarquerLuSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Liste d'IDs à marquer comme lues. Si vide, marque TOUTES les notifications de l'utilisateur.",
    )