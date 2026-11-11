from common.serializers import BaseReferentielSerializer
from .models import Transaction


class TransactionSerializer(BaseReferentielSerializer):
    name_field = "nomTransaction"
    label_field = "Le nom de la transaction"
    error_exists_message = "Une transaction avec ce nom existe déjà."

    class Meta:
        model = Transaction
        fields = ["id", "nomTransaction"]
        read_only_fields = ["id"]

    def validate_nomTransaction(self, value):
        return self.validate_referentiel_field(value)
