from decimal import Decimal

from rest_framework import serializers
from django.utils import timezone
from .models import Paiement, DemandePaiement
from contrats.models import Contrat
from utilisateur.models import Utilisateur


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
    est_mois_a_venir = serializers.BooleanField(read_only=True)
    est_eligible_demande = serializers.BooleanField(read_only=True)
    demande_en_cours = serializers.SerializerMethodField()

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

    def get_demande_en_cours(self, obj) -> dict | None:
        demande = obj.demandes_paiement.filter(statut="EN_ATTENTE").first()
        if demande:
            return {
                "id": demande.id,
                "statut": demande.statut,
                "moyen_paiement": demande.moyen_paiement,
                "date_demande": demande.date_demande,
                "montant": str(demande.montant),
                "telephone": demande.telephone,
                "reference": demande.reference,
            }
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
            "est_mois_a_venir",
            "a_echeance_anterieure_impayee",
            "est_eligible_demande",
            "demande_en_cours",
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
            "est_mois_a_venir",
            "a_echeance_anterieure_impayee",
            "est_eligible_demande",
            "demande_en_cours",
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get("statut") in ("EN_ATTENTE", "EN_RETARD"):
            demande = instance.demandes_paiement.filter(statut="EN_ATTENTE").first()
            if demande:
                ret["mode_paiement"] = demande.moyen_paiement
                if demande.reference:
                    ret["reference"] = demande.reference
            elif not instance.date_paiement and (instance.montant_paye is None or instance.montant_paye == 0):
                # Si non payé et aucune demande en cours, ne pas afficher d'ancienne valeur par défaut
                if ret.get("mode_paiement") == "ESPECE" and not instance.reference:
                    ret["mode_paiement"] = None
        return ret

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrer les contrats actifs (location ET achat)
        self.fields["contrat"].queryset = Contrat.objects.filter(
            statut=Contrat.StatutContrat.ACTIF
        ).select_related("bien", "locataire__user").defer("bien__photos")

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


# ------------------------------------------------------------------
# Sérialiseurs pour les Demandes de Paiement Locataire (Mobile Money)
# ------------------------------------------------------------------

class DemandePaiementSerializer(serializers.ModelSerializer):
    """
    Sérialiseur complet pour la consultation des demandes de paiement.
    """
    locataire_nom = serializers.CharField(
        source="locataire.user.get_full_name",
        read_only=True
    )
    locataire_email = serializers.CharField(
        source="locataire.user.email",
        read_only=True
    )
    bien_titre = serializers.CharField(
        source="facture.contrat.bien.titre",
        read_only=True
    )
    date_echeance_facture = serializers.DateField(
        source="facture.date_echeance",
        read_only=True
    )
    mois_echeance_facture = serializers.CharField(
        source="facture.mois_echeance",
        read_only=True
    )
    statut_facture = serializers.CharField(
        source="facture.statut",
        read_only=True
    )

    class Meta:
        model = DemandePaiement
        fields = [
            "id",
            "locataire",
            "locataire_nom",
            "locataire_email",
            "facture",
            "bien_titre",
            "date_echeance_facture",
            "mois_echeance_facture",
            "statut_facture",
            "montant",
            "date_demande",
            "moyen_paiement",
            "statut",
            "telephone",
            "reference",
            "date_traitement",
            "motif_refus",
        ]
        read_only_fields = [
            "id",
            "locataire",
            "date_demande",
            "statut",
            "date_traitement",
            "motif_refus",
        ]


class DemandePaiementCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la soumission d'une demande de paiement par le locataire.
    Vérifie toutes les règles métier :
    - Exclusivement Mobile Money (MVOLA, ORANGE_MONEY, AIRTEL_MONEY)
    - Facture du mois à venir uniquement
    - Refus des factures passées ou hors mois autorisé
    - Facture non déjà payée
    - Pas de doublon (demande déjà en cours)
    - Montant conforme au montant réel de la facture
    - Locataire propriétaire du contrat
    """
    montant = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False
    )

    class Meta:
        model = DemandePaiement
        fields = [
            "id",
            "facture",
            "montant",
            "moyen_paiement",
            "telephone",
            "reference",
            "date_demande",
            "statut",
        ]
        read_only_fields = ["id", "date_demande", "statut"]

    def validate_moyen_paiement(self, value):
        allowed = [
            DemandePaiement.MoyenPaiement.MVOLA,
            DemandePaiement.MoyenPaiement.ORANGE_MONEY,
            DemandePaiement.MoyenPaiement.AIRTEL_MONEY,
        ]
        if value not in allowed:
            raise serializers.ValidationError(
                "Le moyen de paiement doit être exclusivement Mobile Money (MVOLA, ORANGE_MONEY ou AIRTEL_MONEY)."
            )
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        facture = attrs.get("facture")
        montant = attrs.get("montant")

        if not facture:
            raise serializers.ValidationError({"facture": "La facture est requise."})

        # 1. Vérifier les droits d'accès : le locataire ne peut demander que ses propres factures
        if user and user.is_authenticated:
            if user.role == Utilisateur.Role.LOCATAIRE:
                profil_locataire = getattr(user, "profil_locataire", None)
                if not profil_locataire:
                    raise serializers.ValidationError("Profil locataire introuvable pour cet utilisateur.")
                if facture.contrat.locataire != profil_locataire:
                    raise serializers.ValidationError({
                        "facture": "Vous ne pouvez demander le paiement que de vos propres factures."
                    })
                attrs["locataire"] = profil_locataire
            elif user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
                # Pour admin/agent créant pour un locataire, déduire le locataire du contrat de la facture
                attrs.setdefault("locataire", facture.contrat.locataire)
            else:
                raise serializers.ValidationError("Vous n'êtes pas autorisé à créer une demande de paiement.")

        # 2. Facture déjà payée
        if facture.statut == Paiement.StatutPaiement.PAYE:
            raise serializers.ValidationError({
                "facture": "Une facture déjà payée ne peut pas faire l'objet d'une nouvelle demande."
            })

        # 3. Règle de priorité chronologique : l'échéance antérieure la plus ancienne doit être réglée en premier
        if facture.a_echeance_anterieure_impayee:
            premiere_impayee = Paiement.objects.filter(
                contrat_id=facture.contrat_id,
                date_echeance__lt=facture.date_echeance
            ).exclude(
                statut__in=[Paiement.StatutPaiement.PAYE, Paiement.StatutPaiement.ANNULE]
            ).order_by("date_echeance").first()
            nom_mois = premiere_impayee.mois_echeance if premiere_impayee else "précédente"
            raise serializers.ValidationError({
                "facture": f"Vous devez d'abord régler votre facture la plus ancienne ({nom_mois}) avant de pouvoir payer celle-ci."
            })

        # 4. Doublon : empêche une seconde demande identique lorsqu'une demande est déjà en cours
        if DemandePaiement.objects.filter(
            facture=facture,
            statut=DemandePaiement.StatutDemande.EN_ATTENTE
        ).exists():
            raise serializers.ValidationError({
                "facture": "Une demande de paiement est déjà en cours pour cette facture."
            })

        # 5. Montant correspond au montant réel de la facture
        montant_reel = facture.montant_attendu or facture.montant
        if montant is not None and montant_reel is not None:
            if Decimal(str(montant)) != Decimal(str(montant_reel)):
                raise serializers.ValidationError({
                    "montant": f"Le montant ({montant}) ne correspond pas au montant réel de la facture ({montant_reel})."
                })
        elif montant is None:
            attrs["montant"] = montant_reel

        return attrs

    def create(self, validated_data):
        demande = super().create(validated_data)
        facture = demande.facture
        facture.mode_paiement = demande.moyen_paiement
        if demande.reference:
            facture.reference = demande.reference
        elif not facture.reference:
            facture.reference = f"DEM-{demande.id}"
        facture.save()
        return demande