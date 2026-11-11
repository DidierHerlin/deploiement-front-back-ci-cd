from rest_framework import serializers


class BaseReferentielSerializer(serializers.ModelSerializer):
    """
    Sérialiseur de base pour les modèles référentiels simples (Status, Transaction, TypeBien).
    Mutualise la validation d'unicité insensible à la casse et la vérification de longueur minimale.
    """
    name_field: str = ""
    label_field: str = "Ce champ"
    error_exists_message: str = "Cette entrée existe déjà."

    def validate_referentiel_field(self, value: str) -> str:
        cleaned = value.strip() if isinstance(value, str) else ""

        if not cleaned:
            raise serializers.ValidationError(f"{self.label_field} est obligatoire et ne peut être vide.")

        if len(cleaned) < 2:
            raise serializers.ValidationError(f"{self.label_field} doit contenir au moins 2 caractères.")

        filter_kwargs = {f"{self.name_field}__iexact": cleaned}
        qs = self.Meta.model.objects.filter(**filter_kwargs)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(self.error_exists_message)

        return cleaned
