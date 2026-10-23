from django.contrib.auth import get_user_model
from rest_framework import generics, serializers
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from ..permissions import EstAdmin

Utilisateur = get_user_model()


class BasicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "email",
            "nom",
            "prenoms",
            "role",
            "is_active",
            "date_creation",
            "photo_profil",
            "telephone",
        ]
        read_only_fields = ["date_creation"]


class UtilisateurListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = Utilisateur.objects.all().order_by("-date_creation")
    serializer_class = BasicUserSerializer


class UtilisateurDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = Utilisateur.objects.all()
    serializer_class = BasicUserSerializer

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise ValidationError(
                {"detail": "Vous ne pouvez pas supprimer votre propre compte administrateur."}
            )
        instance.delete()
