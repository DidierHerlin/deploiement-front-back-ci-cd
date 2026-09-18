"""Serializers du module Reservation."""

from rest_framework import serializers

from bien.models import Bien
from utilisateur.models import Locataire

from .models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
    """Serializer pour la création et la mise à jour de réservations."""

    class Meta:
        model = Reservation
        fields = [
            "id",
            "locataire",
            "bien",
            "commentaire",
            "type_reservation",
            "statut",
            "reponse_admin",
            "contrat",
            "date_creation",
        ]
        read_only_fields = ["id", "date_creation", "locataire", "statut", "reponse_admin", "contrat"]

    def validate_bien(self, value):
        if value.statut != Bien.StatutBien.DISPONIBLE:
            raise serializers.ValidationError(
                "Le bien n'est pas disponible pour une réservation."
            )
        return value

    def validate(self, attrs):
        bien = attrs.get("bien")
        type_reservation = attrs.get("type_reservation")

        if bien and type_reservation:
            if (
                type_reservation == Reservation.TypeReservation.LOCATION
                and bien.mode_transaction != Bien.ModeTransaction.LOCATION
            ):
                raise serializers.ValidationError(
                    {"type_reservation": "Ce bien n'est pas proposé à la location."}
                )
            if (
                type_reservation == Reservation.TypeReservation.ACHAT
                and bien.mode_transaction != Bien.ModeTransaction.VENTE
            ):
                raise serializers.ValidationError(
                    {"type_reservation": "Ce bien n'est pas proposé à la vente."}
                )

        return attrs


class ReservationDetailSerializer(serializers.ModelSerializer):
    """Serializer enrichi pour la lecture (list / retrieve)."""

    # Infos locataire
    locataire_nom = serializers.CharField(source="locataire.user.nom", read_only=True)
    locataire_prenoms = serializers.CharField(source="locataire.user.prenoms", read_only=True)
    locataire_email = serializers.CharField(source="locataire.user.email", read_only=True)
    locataire_telephone = serializers.CharField(
        source="locataire.user.telephone", read_only=True, default=""
    )

    # Infos bien
    bien_titre = serializers.CharField(source="bien.titre", read_only=True)
    bien_type = serializers.CharField(source="bien.type", read_only=True)
    bien_adresse = serializers.CharField(source="bien.adresse", read_only=True)
    bien_surface = serializers.FloatField(source="bien.surface", read_only=True)
    bien_loyer_mensuel = serializers.DecimalField(
        source="bien.loyer_mensuel", max_digits=10, decimal_places=2, read_only=True
    )
    bien_prix = serializers.DecimalField(
        source="bien.prix", max_digits=15, decimal_places=2, read_only=True
    )
    bien_mode_transaction = serializers.CharField(
        source="bien.mode_transaction", read_only=True
    )
    bien_statut = serializers.CharField(source="bien.statut", read_only=True)
    bien_nombre_pieces = serializers.IntegerField(
        source="bien.nombre_pieces", read_only=True
    )

    class Meta:
        model = Reservation
        fields = [
            "id",
            "locataire",
            "bien",
            "commentaire",
            "type_reservation",
            "statut",
            "reponse_admin",
            "contrat",
            "date_creation",
            # Locataire
            "locataire_nom",
            "locataire_prenoms",
            "locataire_email",
            "locataire_telephone",
            # Bien
            "bien_titre",
            "bien_type",
            "bien_adresse",
            "bien_surface",
            "bien_loyer_mensuel",
            "bien_prix",
            "bien_mode_transaction",
            "bien_statut",
            "bien_nombre_pieces",
        ]


class RepondreReservationSerializer(serializers.Serializer):
    """Serializer pour la réponse admin/agent à une réservation."""

    reponse_admin = serializers.CharField(required=True)
    statut = serializers.ChoiceField(
        choices=[
            Reservation.StatutReservation.TRAITEE,
            Reservation.StatutReservation.ANNULEE,
        ],
        default=Reservation.StatutReservation.TRAITEE,
        required=False,
    )
