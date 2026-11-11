from common.serializers import BaseReferentielSerializer
from .models import Status


class StatusSerializer(BaseReferentielSerializer):
    name_field = "typeStatus"
    label_field = "Le type de statut"
    error_exists_message = "Ce statut existe déjà."

    class Meta:
        model = Status
        fields = ["id", "typeStatus"]
        read_only_fields = ["id"]

    def validate_typeStatus(self, value):
        return self.validate_referentiel_field(value)
