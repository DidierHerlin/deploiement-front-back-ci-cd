from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Status
from .serializers import StatusSerializer


class StatusViewSet(viewsets.ModelViewSet):
    queryset = Status.objects.all().order_by("id")
    serializer_class = StatusSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["typeStatus"]
    ordering_fields = ["id", "typeStatus"]
