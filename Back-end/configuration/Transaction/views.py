from common.views import BaseReferentielViewSet
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionViewSet(BaseReferentielViewSet):
    queryset = Transaction.objects.all().order_by("id")
    serializer_class = TransactionSerializer
    search_fields = ["nomTransaction"]
    ordering_fields = ["id", "nomTransaction"]
