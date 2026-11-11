from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend


class BaseReferentielViewSet(viewsets.ModelViewSet):
    """ViewSet de base pour les dictionnaires référentiels simples (Status, Transaction, TypeBien)."""
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
