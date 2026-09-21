from typing import Any

from rest_framework import serializers
from django.utils import timezone
from .models import Contrat
from bien.models import Bien

# Règle métier : le dépôt de garantie par défaut vaut ce multiple du loyer
# mensuel, appliqué uniquement si l'utilisateur ne le précise pas lui-même.
MULTIPLICATEUR_DEPOT_GARANTIE = 2


class ContratSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contrat
        fields = [
            "id", "bien", "locataire", "type_contrat", "type_paiement_achat",
            "date_debut", "date_fin", "date_paiement",
            "loyer", "depot_garantie", "prix",
            "statut", "document_pdf", "date_creation",
        ]
        read_only_fields = ["id", "date_creation", "date_paiement", "date_fin"]

    def validate(self, attrs: dict) -> dict:
        instance = self.instance
        type_contrat = attrs.get("type_contrat", getattr(instance, "type_contrat", None))
        bien = attrs.get("bien", getattr(instance, "bien", None))
        locataire = attrs.get("locataire", getattr(instance, "locataire", None))

        if not instance and bien:
            self._pre_remplir_defauts(attrs, bien, type_contrat)

        self._valider_coherence_financiere(attrs, instance, type_contrat)
        self._valider_compatibilite_bien(bien, type_contrat)

        if not instance:
            self._valider_creation(bien, locataire)
        else:
            self._valider_modification(instance, attrs, type_contrat)

        return attrs

    def _pre_remplir_defauts(self, attrs: dict, bien: Bien, type_contrat: str | None) -> None:
        if type_contrat == Contrat.TypeContrat.LOCATION:
            attrs.setdefault('loyer', bien.loyer_mensuel)
            if bien.loyer_mensuel:
                attrs.setdefault('depot_garantie', bien.loyer_mensuel * MULTIPLICATEUR_DEPOT_GARANTIE)
            else:
                attrs.setdefault('depot_garantie', 0)
                
            # Calcul automatique des dates
            from dateutil.relativedelta import relativedelta
            
            if not attrs.get('date_debut'):
                attrs['date_debut'] = timezone.now().date()
            
            attrs['date_fin'] = attrs['date_debut'] + relativedelta(years=1)
                
        elif type_contrat == Contrat.TypeContrat.ACHAT:
            attrs.setdefault('prix', bien.prix)
            # Pas de date_debut par defaut pour ne pas imposer de manuelle. Le systeme utilise date_creation
            attrs['date_fin'] = None
            attrs['date_debut'] = None
            if not getattr(self, "instance", None):
                attrs['statut'] = Contrat.StatutContrat.RESERVE

    def _valider_coherence_financiere(self, attrs: dict, instance: Contrat | None, type_contrat: str | None) -> None:
        if type_contrat == Contrat.TypeContrat.LOCATION:
            loyer = attrs.get("loyer", getattr(instance, "loyer", None))
            depot = attrs.get("depot_garantie", getattr(instance, "depot_garantie", None))
            prix = attrs.get("prix", getattr(instance, "prix", None))
            if loyer is None:
                raise serializers.ValidationError({"loyer": "Le loyer est obligatoire pour une location."})
            if depot is None:
                raise serializers.ValidationError({"depot_garantie": "Le dépôt de garantie est obligatoire pour une location."})
            if prix is not None:
                raise serializers.ValidationError({"prix": "Le prix n'est pas utilisé pour une location."})
            if "type_paiement_achat" in attrs and attrs["type_paiement_achat"]:
                raise serializers.ValidationError({"type_paiement_achat": "Non applicable pour une location."})

        elif type_contrat == Contrat.TypeContrat.ACHAT:
            prix = attrs.get("prix", getattr(instance, "prix", None))
            type_paiement_achat = attrs.get("type_paiement_achat", getattr(instance, "type_paiement_achat", None))
            if type_paiement_achat is None:
                raise serializers.ValidationError({"type_paiement_achat": "Le type de paiement est obligatoire pour un achat."})
            if prix is None:
                raise serializers.ValidationError({"prix": "Le prix est obligatoire pour un achat."})
            if "loyer" in attrs and attrs["loyer"] is not None:
                raise serializers.ValidationError({"loyer": "Le loyer n'est pas utilisé pour un achat."})
            if "depot_garantie" in attrs and attrs["depot_garantie"] is not None:
                raise serializers.ValidationError({"depot_garantie": "Le dépôt de garantie n'est pas utilisé pour un achat."})

    def _valider_compatibilite_bien(self, bien: Bien | None, type_contrat: str | None) -> None:
        if not bien:
            return
        if type_contrat == Contrat.TypeContrat.LOCATION and bien.mode_transaction != Bien.ModeTransaction.LOCATION:
            raise serializers.ValidationError({"bien": "Ce bien n'est pas proposé à la location."})
        if type_contrat == Contrat.TypeContrat.ACHAT and bien.mode_transaction != Bien.ModeTransaction.VENTE:
            raise serializers.ValidationError({"bien": "Ce bien n'est pas proposé à la vente."})

    def _valider_creation(self, bien: Bien | None, locataire: Any) -> None:
        if bien and bien.statut != Bien.StatutBien.DISPONIBLE:
            raise serializers.ValidationError({"bien": "Le bien n'est pas disponible (il est déjà loué ou vendu)."})
        if locataire and not hasattr(locataire, 'user'):
            raise serializers.ValidationError({"locataire": "Le locataire doit être un utilisateur."})

    def _valider_modification(self, instance: Contrat, attrs: dict, type_contrat: str | None) -> None:
        ancien_statut = instance.statut
        nouveau_statut = attrs.get("statut", ancien_statut)

        if "type_contrat" in attrs and attrs["type_contrat"] != instance.type_contrat:
            raise serializers.ValidationError({"type_contrat": "Le type de contrat ne peut pas être modifié."})
        if "bien" in attrs and attrs["bien"] != instance.bien:
            raise serializers.ValidationError({"bien": "Le bien associé ne peut pas être modifié."})
        if "locataire" in attrs and attrs["locataire"] != instance.locataire:
            raise serializers.ValidationError({"locataire": "Le locataire ne peut pas être modifié."})

        if ancien_statut == Contrat.StatutContrat.VENDU:
            raise serializers.ValidationError({"statut": "Un contrat vendu ne peut pas être modifié."})
        if ancien_statut in (Contrat.StatutContrat.RESILIE, Contrat.StatutContrat.TERMINE):
            if nouveau_statut != ancien_statut:
                raise serializers.ValidationError({"statut": "Un contrat résilié ou terminé ne peut pas changer de statut."})
        if ancien_statut == Contrat.StatutContrat.ACTIF:
            if type_contrat == Contrat.TypeContrat.LOCATION:
                if nouveau_statut not in (Contrat.StatutContrat.RESILIE, Contrat.StatutContrat.TERMINE):
                    raise serializers.ValidationError({"statut": "Un contrat de location actif ne peut devenir que RESILIE ou TERMINE."})
            elif type_contrat == Contrat.TypeContrat.ACHAT:
                if nouveau_statut != Contrat.StatutContrat.VENDU:
                    raise serializers.ValidationError({"statut": "Un contrat d'achat actif ne peut devenir que VENDU."})

class ContratListSerializer(serializers.ModelSerializer):
    bien_titre = serializers.CharField(source="bien.titre", read_only=True)
    bien_type = serializers.CharField(source="bien.type", read_only=True)
    locataire_nom = serializers.CharField(source="locataire.user.nom", read_only=True)
    locataire_prenoms = serializers.CharField(source="locataire.user.prenoms", read_only=True)

    class Meta:
        model = Contrat
        fields = [
            "id", "bien", "bien_titre", "bien_type",
            "locataire", "locataire_nom", "locataire_prenoms",
            "type_contrat", "type_paiement_achat", "date_debut", "date_fin", "date_paiement",
            "loyer", "depot_garantie", "prix", "statut", "document_pdf", "date_creation"
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # ✅ Filtrage des biens disponibles uniquement en création
        # (aucune modification apportée, principe inchangé)
        if not self.instance:
            self.fields['bien'].queryset = Bien.objects.filter(
                statut=Bien.StatutBien.DISPONIBLE
            ).select_related('proprietaire__user').defer('photos')


# ------------------------------------------------------------------
# Sérialiseur pour les échéances de paiement à venir
# ------------------------------------------------------------------
class EcheanceSerializer(serializers.Serializer):
    date_echeance = serializers.DateField()
    montant_attendu = serializers.DecimalField(max_digits=10, decimal_places=2)
    est_paye = serializers.BooleanField()
    contrat_id = serializers.IntegerField()
    bien_titre = serializers.CharField()
    locataire_nom = serializers.CharField()