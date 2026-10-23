from rest_framework import serializers
from .models import TypeBien


class TypeBienSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeBien
        fields = ["id", "designation"]
        read_only_fields = ["id"]

    def validate_designation(self, value):
        cleaned = value.strip() if isinstance(value, str) else ""

        if not cleaned:
            raise serializers.ValidationError("La désignation est obligatoire et ne peut être vide.")

        if len(cleaned) < 2:
            raise serializers.ValidationError("La désignation doit contenir au moins 2 caractères.")

        qs = TypeBien.objects.filter(designation__iexact=cleaned)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ce type de bien existe déjà.")

        return cleaned
