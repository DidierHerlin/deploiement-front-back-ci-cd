from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from utilisateur.models import Proprietaire, Utilisateur
from utilisateur.serializers import ProprietaireSimpleSerializer
from . import validators
from .models import Bien

_valider_prix_positif = validators.PositiveValueValidator("Le prix ne peut pas Ãªtre nÃ©gatif.")


class BienSerializer(serializers.ModelSerializer):
    proprietaire = ProprietaireSimpleSerializer(read_only=True)
    proprietaire_id = serializers.PrimaryKeyRelatedField(
        queryset=Proprietaire.objects.all(),
        source="proprietaire",
        write_only=True,
        required=False,
        help_text="Requis pour un agent ou administrateur ; interdit pour un propriÃ©taire.",
    )

    class Meta:
        model = Bien
        fields = [
            "id", "proprietaire", "proprietaire_id",
            "titre", "type", "mode_transaction", "adresse", "surface",
            "nombre_pieces", "loyer_mensuel", "prix", "statut", "photos",
        ]
        read_only_fields = ["id"]

    def validate_surface(self, value: float) -> float:
        try:
            validators.validate_surface(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0]) from exc
        return value

    def validate_nombre_pieces(self, value: int | None) -> int | None:
        try:
            validators.validate_nombre_pieces(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0]) from exc
        return value

    def validate_loyer_mensuel(self, value: Decimal | None) -> Decimal | None:
        try:
            validators.validate_loyer_mensuel(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0]) from exc
        return value

    def validate_prix(self, value: Decimal | None) -> Decimal | None:
        try:
            _valider_prix_positif(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0]) from exc
        return value

    def validate_photos(self, value: list | None) -> list | None:
        try:
            validators.validate_photos(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                "Le champ 'photos' doit Ãªtre une liste d'URLs (chaÃ®nes)."
            ) from exc
        return value

    def validate_statut(self, value: str) -> str:
        request = self.context.get("request")
        est_admin = bool(request and getattr(request.user, "role", None) == Utilisateur.Role.ADMIN)

        if value in (Bien.StatutBien.LOUE, Bien.StatutBien.VENDU) and not est_admin:
            raise serializers.ValidationError(
                f"Le statut '{value}' est attribuÃ© automatiquement par un contrat et ne peut pas Ãªtre dÃ©fini manuellement."
            )
        return value

    # Validation inter-champs

    def validate(self, attrs: dict) -> dict:
        request = self.context["request"]
        user = request.user

        self._valider_proprietaire(attrs, user)
        self._valider_coherence_financiere(attrs)
        self._valider_type_bien(attrs)
        self._valider_modifiabilite()

        return attrs

    def _valider_proprietaire(self, attrs: dict, user: Any) -> None:
        if user.role == Utilisateur.Role.PROPRIETAIRE and "proprietaire" in attrs:
            raise serializers.ValidationError({
                "proprietaire_id": "Vous n'Ãªtes pas autorisÃ© Ã  spÃ©cifier un propriÃ©taire : ce champ est automatiquement associÃ© Ã  votre compte."
            })

        creation = self.instance is None
        if creation and user.role in (Utilisateur.Role.AGENT, Utilisateur.Role.ADMIN) and "proprietaire" not in attrs:
            raise serializers.ValidationError({
                "proprietaire_id": "Ce champ est requis pour un agent ou un administrateur."
            })

    def _valider_coherence_financiere(self, attrs: dict) -> None:
        mode = attrs.get("mode_transaction", getattr(self.instance, "mode_transaction", None))
        loyer = attrs.get("loyer_mensuel", getattr(self.instance, "loyer_mensuel", None))
        prix = attrs.get("prix", getattr(self.instance, "prix", None))

        if mode == Bien.ModeTransaction.LOCATION:
            if loyer is None:
                raise serializers.ValidationError({"loyer_mensuel": "Le loyer mensuel est obligatoire pour une location."})
            if prix is not None:
                raise serializers.ValidationError({"prix": "Le prix ne doit pas Ãªtre renseignÃ© pour une location."})
        elif mode == Bien.ModeTransaction.VENTE:
            if prix is None:
                raise serializers.ValidationError({"prix": "Le prix est obligatoire pour une vente."})
            if loyer is not None:
                raise serializers.ValidationError({"loyer_mensuel": "Le loyer mensuel ne doit pas Ãªtre renseignÃ© pour une vente."})

    def _valider_type_bien(self, attrs: dict) -> None:
        type_bien = attrs.get("type", getattr(self.instance, "type", None))
        nombre_pieces = attrs.get("nombre_pieces", getattr(self.instance, "nombre_pieces", None))
        if type_bien == Bien.TypeBien.TERRAIN and nombre_pieces is not None:
            raise serializers.ValidationError({"nombre_pieces": "Le nombre de piÃ¨ces n'est pas applicable pour un terrain."})
        if type_bien != Bien.TypeBien.TERRAIN and nombre_pieces is None:
            raise serializers.ValidationError({"nombre_pieces": "Le nombre de piÃ¨ces est obligatoire pour ce type de bien."})

    def _valider_modifiabilite(self) -> None:
        if not self.instance:
            return
        if self.instance.statut in (Bien.StatutBien.LOUE, Bien.StatutBien.VENDU):
            raise serializers.ValidationError("Ce bien est dÃ©jÃ  louÃ© ou vendu et ne peut pas Ãªtre modifiÃ©.")

    # CrÃ©ation / mise Ã  jour
    def create(self, validated_data: dict) -> Bien:
        request = self.context["request"]
        user = request.user

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            try:
                validated_data["proprietaire"] = user.profil_proprietaire
            except Proprietaire.DoesNotExist as exc:
                raise serializers.ValidationError(
                    "Aucun profil propriÃ©taire n'est associÃ© Ã  ce compte utilisateur."
                ) from exc

        return Bien.objects.create(**validated_data)

    def update(self, instance: Bien, validated_data: dict) -> Bien:
        request = self.context["request"]
        user = request.user

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            validated_data.pop("proprietaire", None)

        return super().update(instance, validated_data)


class BienListSerializer(serializers.ModelSerializer):
    proprietaire = ProprietaireSimpleSerializer(read_only=True)
    photos = serializers.SerializerMethodField()

    class Meta:
        model = Bien
        fields = ['id', 'titre', 'type', 'mode_transaction', 'adresse', 'surface', 'nombre_pieces', 'loyer_mensuel', 'prix', 'statut', 'proprietaire', 'photos']

    def get_photos(self, obj) -> list:
        if obj.photos and isinstance(obj.photos, list) and len(obj.photos) > 0:
            return [obj.photos[0]]
        return []
