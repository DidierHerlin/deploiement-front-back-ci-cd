from common.views import BaseReferentielViewSet
from .models import Status
from .serializers import StatusSerializer


class StatusViewSet(BaseReferentielViewSet):
    queryset = Status.objects.all().order_by("id")
    serializer_class = StatusSerializer
    search_fields = ["typeStatus"]
    ordering_fields = ["id", "typeStatus"]
