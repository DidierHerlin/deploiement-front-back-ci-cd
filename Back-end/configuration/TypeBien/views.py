from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import TypeBien
from .serializers import TypeBienSerializer


class TypeBienViewSet(viewsets.ModelViewSet):
    queryset = TypeBien.objects.all().order_by("id")
    serializer_class = TypeBienSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["designation"]
    ordering_fields = ["id", "designation"]
