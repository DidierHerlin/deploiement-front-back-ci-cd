from common.views import BaseReferentielViewSet
from .models import TypeBien
from .serializers import TypeBienSerializer

 #views biens  
class TypeBienViewSet(BaseReferentielViewSet):
    queryset = TypeBien.objects.all().order_by("id")
    serializer_class = TypeBienSerializer
    search_fields = ["designation"]
    ordering_fields = ["id", "designation"]
