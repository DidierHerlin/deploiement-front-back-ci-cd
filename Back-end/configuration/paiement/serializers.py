from decimal import Decimal

from rest_framework import serializers
from django.utils import timezone
from .models import Paiement
from contrats.models import Contrat


class PaiementSerializer(serializers.ModelSerializer):
    # Champs additionnels pour l'affichage
    locataire_nom = serializers.CharField(
        source="contrat.locataire.user.get_full_name",
        read_only=True
    )
    bien_titre = serializers.CharField(
        source="contrat.bien.titre",
        read_only=True
    )
    loyer_contrat = serializers.DecimalField(
        source="contrat.loyer",
        read_only=True,
        max_digits=10,
        decimal_places=2
    )

    # --- Champs calculés (lecture seule) ---

    # Message informatif sur le mois concerné par cette échéance
    message_mois = serializers.CharField(read_only=True)

    montant_restant = serializers.DecimalField(
        read_only=True,
        max_digits=10,
        decimal_places=2,
        allow_null=True
    )

    part_proprietaire = serializers.SerializerMethodField()
    commission_agent = serializers.SerializerMethodField()

    def get_part_proprietaire(self, obj) -> float | None:
        if obj.contrat.type_contrat == "LOCATION" and obj.contrat.loyer:
            commission = float(obj.contrat.loyer) * 0.10
            montant = float(obj.montant or obj.montant_attendu or 0)
            return montant - commission
        return None

    def get_commission_agent(self, obj) -> float | None:
        if obj.contrat.type_contrat == "LOCATION" and obj.contrat.loyer:
            return float(obj.contrat.loyer) * 0.10
        return None

    class Meta:
        model = Paiement
        fields = [
            "id",
            "contrat",
            "num_echeance",
            "date_echeance",
            "date_paiement_prevue",
            "date_paiement",
            "date_versement_partiel",
            "montant_attendu",
            "montant",
            "montant_paye",
            "montant_restant",
            "mode_paiement",
            "reference",
            "statut",
            "est_partiel",
            "date_creation",
            "locataire_nom",
            "bien_titre",
            "loyer_contrat",
            "est_en_retard",
            "message_mois",
            "part_proprietaire",
            "commission_agent",
        ]
        read_only_fields = [
            "id",
            "num_echeance",
            "date_creation",
            "date_paiement_prevue",
            "date_echeance",
            "date_paiement",
            "date_versement_partiel",
            "montant_attendu",
            "montant_restant",
            "est_en_retard",
            "message_mois",
            "part_proprietaire",
            "commission_agent",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrer les contrats actifs (location ET achat)
        self.fields["contrat"].queryset = Contrat.objects.filter(
            statut=Contrat.StatutContrat.ACTIF
        ).select_related("bien", "locataire__user")

    def validate_montant(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Le montant ne peut pas être négatif."
            )
        return value

    def validate(self, attrs):
        contrat = attrs.get("contrat", getattr(self.instance, "contrat", None))
        montant = attrs.get("montant", getattr(self.instance, "montant", None))
        date_echeance = attrs.get(
            "date_echeance", getattr(self.instance, "date_echeance", None)
        )
        est_partiel = attrs.get(
            "est_partiel", getattr(self.instance, "est_partiel", False)
        )

        # --- 1. Pré-remplissage du montant depuis l'échéancier ---
        # Si le paiement existe déjà en base (échéancier auto), on reprend montant_attendu
        if contrat and montant is None:
            instance = self.instance
            if instance and instance.montant_attendu is not None:
                montant = instance.montant_attendu
            elif contrat.type_contrat == Contrat.TypeContrat.LOCATION:
                montant = contrat.loyer
            elif contrat.type_contrat == Contrat.TypeContrat.ACHAT:
                montant = contrat.prix
            attrs["montant"] = montant

        # --- 2. Pré-remplissage de la date d'échéance ---
        if contrat and date_echeance is None:
            attrs["date_echeance"] = timezone.now().date()

        # --- 3. Vérification montant / montant_attendu ---
        # Pour un paiement non partiel, le montant doit correspondre au montant_attendu
        if contrat and montant is not None and not est_partiel:
            # Récupérer montant_attendu si disponible (paiement issu de l'échéancier)
            montant_attendu = None
            if self.instance and self.instance.montant_attendu is not None:
                montant_attendu = self.instance.montant_attendu
            elif not self.instance:
                # Création manuelle : vérifier contre le loyer (location) ou rien (achat comptant)
                if contrat.type_contrat == Contrat.TypeContrat.LOCATION and contrat.loyer is not None:
                    montant_attendu = contrat.loyer

            if montant_attendu is not None and montant != montant_attendu:
                raise serializers.ValidationError(
                    {
                        "montant": (
                            f"Le montant ({montant}) doit correspondre "
                            f"au montant attendu ({montant_attendu}). "
                            "Cochez 'Paiement partiel' pour déroger à cette règle."
                        )
                    }
                )

        # --- 4. Référence obligatoire pour Mobile Money ---
        mode = attrs.get("mode_paiement", getattr(self.instance, "mode_paiement", None))
        reference = attrs.get("reference", getattr(self.instance, "reference", None))
        mobile_money_modes = (
            Paiement.ModePaiement.MVOLA,
            Paiement.ModePaiement.ORANGE_MONEY,
            Paiement.ModePaiement.AIRTEL_MONEY,
        )
        if mode and mode in mobile_money_modes and not reference:
            raise serializers.ValidationError(
                {
                    "reference": (
                        "La référence est obligatoire pour les paiements "
                        "par Mobile Money."
                    )
                }
            )

        # --- 5. Empêcher un second paiement complet pour la même échéance ---
        if not self.instance and contrat and not est_partiel:
            date_echeance_val = attrs.get("date_echeance")
            if date_echeance_val:
                already_paid = Paiement.objects.filter(
                    contrat=contrat,
                    date_echeance=date_echeance_val,
                    statut=Paiement.StatutPaiement.PAYE,
                ).exists()
                if already_paid:
                    raise serializers.ValidationError(
                        {
                            "date_echeance": (
                                "Un paiement complet a déjà été validé "
                                "pour cette échéance."
                            )
                        }
                    )

        return attrs

    def create(self, validated_data):
        # La date_paiement n'est renseignée que lors du passage à PAYE
        # (géré dans Paiement.save() et valider_paiement())
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Si on enregistre un paiement partiel, mettre à jour montant_paye et date_versement_partiel
        est_partiel = validated_data.get("est_partiel", instance.est_partiel)
        if est_partiel:
            montant_verse = validated_data.get("montant", instance.montant)
            validated_data["montant_paye"] = montant_verse
            if not instance.date_versement_partiel:
                validated_data["date_versement_partiel"] = timezone.now().date()
        return super().update(instance, validated_data)