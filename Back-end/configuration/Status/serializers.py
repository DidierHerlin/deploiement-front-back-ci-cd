from rest_framework import serializers
from .models import Status


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ["id", "typeStatus"]
        read_only_fields = ["id"]

    def validate_typeStatus(self, value):
        cleaned = value.strip() if isinstance(value, str) else ""

        if not cleaned:
            raise serializers.ValidationError("Le type de statut est obligatoire et ne peut être vide.")

        if len(cleaned) < 2:
            raise serializers.ValidationError("Le type de statut doit contenir au moins 2 caractères.")

        qs = Status.objects.filter(typeStatus__iexact=cleaned)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ce statut existe déjà.")

        return cleaned
