from ..models import Locataire, Utilisateur
from ..serializers import LocataireSerializer
from .base_views import BaseProfileDetailView, BaseProfileListView


class LocataireDetailView(BaseProfileDetailView):
    model = Locataire
    serializer_class = LocataireSerializer
    profile_label = "locataire"
    role_type = Utilisateur.Role.LOCATAIRE


class LocataireListView(BaseProfileListView):
    """Liste de tous les locataires (agent/admin uniquement)"""
    model = Locataire
    serializer_class = LocataireSerializer
