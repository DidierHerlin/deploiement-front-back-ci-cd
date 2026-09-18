from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from ..models import Utilisateur
from .utilisateur import UtilisateurSerializer


class AgentRegisterSerializer(serializers.Serializer):

    email = serializers.EmailField()
    nom = serializers.CharField(max_length=100)
    prenoms = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    telephone = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if Utilisateur.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte avec cet email existe déjà.")
        return value

    def save(self, **kwargs):
        data = self.validated_data
        user = Utilisateur.objects.create_user(
            email=data["email"],
            password=data["password"],
            nom=data["nom"],
            prenoms=data["prenoms"],
            role=Utilisateur.Role.AGENT,
            telephone=data.get("telephone", ""),
        )
        return user


# LOGIN JWT
class UtilisateurTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        token["nom_complet"] = user.get_full_name()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["utilisateur"] = UtilisateurSerializer(self.user, context=self.context).data
        return data
