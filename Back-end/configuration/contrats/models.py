from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import F, Q, UniqueConstraint
from bien.models import Bien
from utilisateur.models import Locataire
from dateutil.relativedelta import relativedelta


class Contrat(models.Model):

    class TypeContrat(models.TextChoices):
        LOCATION = "LOCATION", "Location"
        ACHAT = "ACHAT", "Achat"

    class StatutContrat(models.TextChoices):
        RESERVE = "RESERVE", "Réservé"
        ACTIF = "ACTIF", "Actif"
        RESILIE = "RESILIE", "Résilié"
        TERMINE = "TERMINE", "Terminé"
        VENDU = "VENDU", "Vendu"  
        
    bien = models.ForeignKey(
        Bien,
        on_delete=models.PROTECT,
        related_name="contrats",
        verbose_name="Bien concerné",
    )
    locataire = models.ForeignKey(
        Locataire,
        on_delete=models.PROTECT,
        related_name="contrats",
        verbose_name="Locataire / Acheteur",
    )

    type_contrat = models.CharField(
        "type de contrat",
        max_length=20,
        choices=TypeContrat.choices,
        default=TypeContrat.LOCATION,
    )

    class TypePaiementAchat(models.TextChoices):
        TOTALITE = "TOTALITE", "Totalité"
        PARTIEL = "PARTIEL", "Partiel"

    type_paiement_achat = models.CharField(
        "type de paiement (achat)",
        max_length=20,
        choices=TypePaiementAchat.choices,
        null=True,
        blank=True,
    )

    date_debut = models.DateField("Date de début", null=True, blank=True)
    date_fin = models.DateField("Date de fin", null=True, blank=True)  # Pour location

    date_paiement = models.DateField(
        "Date de paiement",
        null=True,
        blank=True,
        editable=False,  # ne doit jamais être saisi manuellement, y compris dans l'admin
    )

    # Champs pour la location
    loyer = models.DecimalField(
        "Loyer mensuel",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    depot_garantie = models.DecimalField(
        "Dépôt de garantie",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Champ pour l'achat
    prix = models.DecimalField(
        "Prix de vente",
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )

    statut = models.CharField(
        "statut",
        max_length=20,
        choices=StatutContrat.choices,
        default=StatutContrat.ACTIF,
        db_index=True,
    )

    document_pdf = models.CharField(
        "Chemin du document PDF", max_length=255, null=True, blank=True
    )
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        db_table = "contrat"
        ordering = ["-date_creation"]
        verbose_name = "Contrat"
        verbose_name_plural = "Contrats"
        constraints = [
            # Cohérence type_contrat / champs financiers
            models.CheckConstraint(
                check=(
                    (models.Q(type_contrat="LOCATION") & models.Q(loyer__isnull=False) & models.Q(depot_garantie__isnull=False) & models.Q(prix__isnull=True) & models.Q(type_paiement_achat__isnull=True)) |
                    (models.Q(type_contrat="ACHAT") & models.Q(prix__isnull=False) & models.Q(loyer__isnull=True) & models.Q(depot_garantie__isnull=True) & models.Q(type_paiement_achat__isnull=False))
                ),
                name="contrat_coherence_location_achat"
            ),
            # Statuts autorisés selon type
            models.CheckConstraint(
                check=(
                    (models.Q(type_contrat="LOCATION") & models.Q(statut__in=["ACTIF", "RESILIE", "TERMINE"])) |
                    (models.Q(type_contrat="ACHAT") & models.Q(statut__in=["RESERVE", "ACTIF", "VENDU"]))
                ),
                name="contrat_statut_autorise"
            ),
            # Pour location : date_fin obligatoire et > date_debut, date_debut obligatoire. (Sauf achat : date_fin nulle, date_debut optionnelle)
            models.CheckConstraint(
                check=(
                    (models.Q(type_contrat="LOCATION") & models.Q(date_fin__isnull=False) & models.Q(date_debut__isnull=False) & models.Q(date_fin__gt=F("date_debut"))) |
                    (models.Q(type_contrat="ACHAT") & models.Q(date_fin__isnull=True))
                ),
                name="contrat_dates_location"
            ),
            # Montants positifs
            models.CheckConstraint(
                check=models.Q(loyer__gte=0) | models.Q(loyer__isnull=True),
                name="contrat_loyer_positive"
            ),
            models.CheckConstraint(
                check=models.Q(depot_garantie__gte=0) | models.Q(depot_garantie__isnull=True),
                name="contrat_depot_positive"
            ),
            models.CheckConstraint(
                check=models.Q(prix__gte=0) | models.Q(prix__isnull=True),
                name="contrat_prix_positive"
            ),
            # Un seul contrat ACTIF par bien (pour location comme pour achat)
            UniqueConstraint(
                fields=["bien"],
                condition=Q(statut="ACTIF"),
                name="rg13_un_seul_contrat_actif_par_bien",
            ),
        ]

    def __str__(self) -> str:
        return f"Contrat #{self.pk} — {self.get_type_contrat_display()} ({self.statut})"

    def clean(self) -> None:
        super().clean()
        self._valider_champs_selon_type()
        if self.pk is None:
            self._valider_creation()
        else:
            self._valider_transition_statut()

    def _valider_champs_selon_type(self) -> None:
        if self.type_contrat == self.TypeContrat.LOCATION:
            if not self.date_debut:
                raise ValidationError({"date_debut": "La date de début est obligatoire pour une location."})
            if not self.date_fin:
                raise ValidationError({"date_fin": "La date de fin est obligatoire pour une location."})
            if self.date_fin and self.date_debut and self.date_fin <= self.date_debut:
                raise ValidationError({"date_fin": "La date de fin doit être postérieure à la date de début."})
            if self.loyer is None:
                raise ValidationError({"loyer": "Le loyer est obligatoire pour une location."})
            if self.depot_garantie is None:
                raise ValidationError({"depot_garantie": "Le dépôt de garantie est obligatoire pour une location."})
            if self.type_paiement_achat is not None:
                raise ValidationError({"type_paiement_achat": "Ce champ ne s'applique qu'aux achats."})
        elif self.type_contrat == self.TypeContrat.ACHAT:
            if self.prix is None:
                raise ValidationError({"prix": "Le prix est obligatoire pour un achat."})
            if self.date_fin is not None:
                raise ValidationError({"date_fin": "La date de fin n'est pas utilisée pour un achat."})
            if self.type_paiement_achat is None:
                raise ValidationError({"type_paiement_achat": "Le type de paiement est obligatoire pour un achat."})

    def _valider_creation(self) -> None:
        if self.bien.statut != Bien.StatutBien.DISPONIBLE:
            raise ValidationError({"bien": "Le bien n'est pas disponible (il est déjà loué ou vendu)."})
        if self.type_contrat == self.TypeContrat.LOCATION and self.bien.mode_transaction != Bien.ModeTransaction.LOCATION:
            raise ValidationError({"type_contrat": "Ce bien n'est pas proposé à la location."})
        if self.type_contrat == self.TypeContrat.ACHAT and self.bien.mode_transaction != Bien.ModeTransaction.VENTE:
            raise ValidationError({"type_contrat": "Ce bien n'est pas proposé à la vente."})

    def _valider_transition_statut(self) -> None:
        ancien_statut = Contrat.objects.filter(pk=self.pk).values_list("statut", flat=True).get()

        if ancien_statut == self.StatutContrat.VENDU:
            raise ValidationError({"statut": "Un contrat vendu ne peut pas être modifié."})
        if ancien_statut == self.StatutContrat.TERMINE and self.statut != ancien_statut:
            raise ValidationError({"statut": "Un contrat terminé ne peut pas changer de statut."})
        if ancien_statut == self.StatutContrat.RESILIE and self.statut != ancien_statut:
            raise ValidationError({"statut": "Un contrat résilié ne peut pas changer de statut."})
        if self.statut == self.StatutContrat.ACTIF and ancien_statut != self.StatutContrat.ACTIF:
            raise ValidationError({"statut": "Un contrat ne peut pas repasser au statut ACTIF une fois qu'il en est sorti."})

    # Sauvegarde automatique de la date de paiement (1 mois après date_debut)
    def save(self, *args, **kwargs) -> None:
        self._calculer_date_paiement()
        self.full_clean()
        super().save(*args, **kwargs)

    def _calculer_date_paiement(self) -> None:
        if self.date_debut is not None:
            self.date_paiement = self.date_debut + relativedelta(months=1)

    # Génération des échéances de paiement pour les contrats de location
    def get_echeances_a_venir(self, date_reference=None, paiements_payes=None):
        from django.utils import timezone
        from paiement.models import Paiement

        # Uniquement pour les contrats de location actifs
        if self.type_contrat != self.TypeContrat.LOCATION or self.statut != self.StatutContrat.ACTIF:
            return []

        if date_reference is None:
            date_reference = timezone.now().date()
            
        if paiements_payes is None:
            paiements_payes = set(Paiement.objects.filter(
                contrat=self,
                statut=Paiement.StatutPaiement.PAYE
            ).values_list('date_echeance', flat=True))

        # Première échéance : le mois suivant la date_debut
        echeance = self.date_debut + relativedelta(months=1)

        while echeance <= self.date_fin:
            # Vérifier si cette échéance est déjà payée
            deja_paye = echeance in paiements_payes

            if not deja_paye:
                # Retourne la première échéance non payée (la prochaine attendue)
                return [{
                    'date_echeance': echeance,
                    'montant_attendu': self.loyer,
                    'est_paye': False,
                    'contrat_id': self.id,
                    'bien_titre': self.bien.titre,
                    'locataire_nom': self.locataire.user.get_full_name(),
                }]

            # Passer au mois suivant
            echeance += relativedelta(months=1)

        return []

    # Méthodes de transition de statut

    def _transitionner(
        self,
        *,
        type_attendu: "Contrat.TypeContrat",
        nouveau_statut: "Contrat.StatutContrat",
        save: bool,
        message_type_invalide: str,
        message_statut_invalide: str,
    ) -> None:
        if self.type_contrat != type_attendu:
            raise ValueError(message_type_invalide)
        if self.statut != self.StatutContrat.ACTIF:
            raise ValueError(message_statut_invalide)
        self.statut = nouveau_statut
        if save:
            self.save(update_fields=["statut"])

    def resilier(self, *, save: bool = True) -> None:
        self._transitionner(
            type_attendu=self.TypeContrat.LOCATION,
            nouveau_statut=self.StatutContrat.RESILIE,
            save=save,
            message_type_invalide="Seuls les contrats de location peuvent être résiliés.",
            message_statut_invalide="Seul un contrat actif peut être résilié.",
        )

    def terminer(self, *, save: bool = True) -> None:
        self._transitionner(
            type_attendu=self.TypeContrat.LOCATION,
            nouveau_statut=self.StatutContrat.TERMINE,
            save=save,
            message_type_invalide="Seuls les contrats de location peuvent être terminés.",
            message_statut_invalide="Seul un contrat actif peut être terminé.",
        )

    def finaliser_vente(self, *, save: bool = True) -> None:
        if self.type_contrat != self.TypeContrat.ACHAT:
            raise ValueError("Seuls les contrats d'achat peuvent être finalisés.")
        if self.statut not in (self.StatutContrat.ACTIF, self.StatutContrat.RESERVE):
            raise ValueError("Seul un contrat actif ou réservé peut être finalisé.")
        self.statut = self.StatutContrat.VENDU
        if save:
            self.save(update_fields=["statut"])

    @property
    def est_actif(self) -> bool:
        return self.statut == self.StatutContrat.ACTIF