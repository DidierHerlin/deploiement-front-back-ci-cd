from common.serializers import BaseReferentielSerializer
from .models import TypeBien


class TypeBienSerializer(BaseReferentielSerializer):
    name_field = "designation"
    label_field = "La désignation"
    error_exists_message = "Ce type de bien existe déjà."

    class Meta:
        model = TypeBien
        fields = ["id", "designation"]
        read_only_fields = ["id"]

    def validate_designation(self, value):
        return self.validate_referentiel_field(value)
