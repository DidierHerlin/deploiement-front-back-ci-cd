from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["id", "nomTransaction"]
        read_only_fields = ["id"]

    def validate_nomTransaction(self, value):
        cleaned = value.strip() if isinstance(value, str) else ""

        if not cleaned:
            raise serializers.ValidationError("Le nom de la transaction est obligatoire et ne peut être vide.")

        if len(cleaned) < 2:
            raise serializers.ValidationError("Le nom de la transaction doit contenir au moins 2 caractères.")

        qs = Transaction.objects.filter(nomTransaction__iexact=cleaned)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Une transaction avec ce nom existe déjà.")

        return cleaned
