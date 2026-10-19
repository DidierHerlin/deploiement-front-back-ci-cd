from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from contrats.models import Contrat
from utilisateur.models import Locataire
import os  # Pour la fonction de chemin


# Fonction pour générer le chemin de stockage du PDF
def quittance_upload_path(instance, filename):
    """
    Génère un chemin personnalisé pour les quittances.
    Exemple : quittances/contrat_1/paiement_5.pdf
    """
    return f"quittances/contrat_{instance.contrat.id}/paiement_{instance.pk}.pdf"


class Paiement(models.Model):
    class ModePaiement(models.TextChoices):
        MVOLA = "MVOLA", "Mvola"
        ORANGE_MONEY = "ORANGE_MONEY", "Orange Money"
        AIRTEL_MONEY = "AIRTEL_MONEY", "Airtel Money"
        VIREMENT = "VIREMENT", "Virement"
        CHEQUE = "CHEQUE", "Chèque"
        ESPECE = "ESPECE", "Espèce"

    class StatutPaiement(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        PAYE = "PAYE", "Payé"
        PARTIEL = "PARTIEL", "Partiel"
        EN_RETARD = "EN_RETARD", "En retard"
        ANNULE = "ANNULE", "Annulé"

    contrat = models.ForeignKey(
        Contrat,
        on_delete=models.PROTECT,
        related_name="paiements",
        verbose_name="Contrat associé"
    )

    date_paiement_prevue = models.DateField(
        "Date de paiement prévue",
        null=True,
        blank=True,
        editable=False,
        help_text="Date de paiement prévue générée automatiquement"
    )

    # Date d'échéance prévue (ex: 5 du mois)
    date_echeance = models.DateField(
        "Date d'échéance",
        editable=False,
        db_index=True,
        help_text="Date à laquelle le paiement est attendu"
    )

    # --- Champs de l'échéancier automatique ---
    montant_attendu = models.DecimalField(
        "Montant attendu",
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Montant attendu pour cette échéance (rempli automatiquement par l'échéancier)",
    )
    montant_paye = models.DecimalField(
        "Montant payé",
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Montant effectivement payé pour cette échéance",
    )

    # Date effective du paiement (remplie automatiquement à la création)
    date_paiement = models.DateField(
        "Date de paiement",
        null=True,
        blank=True,
        help_text="Date effective du paiement (remplie lors de l'enregistrement)"
    )

    # Date du versement partiel (remplie lors d'un paiement partiel)
    date_versement_partiel = models.DateField(
        "Date du versement partiel",
        null=True,
        blank=True,
        help_text="Date à laquelle le versement partiel a été effectué"
    )

    montant = models.DecimalField(
        "Montant",
        max_digits=15,
        decimal_places=2,
        help_text="Montant payé (doit correspondre au montant attendu du contrat, sauf paiement partiel)"
    )

    # mode_paiement reste NULL lors de la génération automatique ;
    # il est renseigné uniquement au moment de l'enregistrement réel du paiement.
    mode_paiement = models.CharField(
        "Mode de paiement",
        max_length=20,
        choices=ModePaiement.choices,
        null=True,
        blank=True,
    )

    reference = models.CharField(
        "Référence de transaction",
        max_length=100,
        blank=True,
        null=True,
        help_text="Obligatoire pour les paiements par Mobile Money"
    )

    statut = models.CharField(
        "Statut",
        max_length=20,
        choices=StatutPaiement.choices,
        default=StatutPaiement.EN_ATTENTE,
        db_index=True
    )

    est_partiel = models.BooleanField(
        "Paiement partiel",
        default=False,
        help_text="Cocher si le paiement ne couvre pas la totalité du montant attendu"
    )

    # Numéro d'échéance (1 = premier paiement, 2 = deuxième, etc.)
    num_echeance = models.PositiveSmallIntegerField(
        "Numéro d'échéance",
        null=True,
        blank=True,
        help_text="Position de cette échéance dans l'échéancier (1 = première)"
    )

    # --- NOUVEAU CHAMP : Fichier quittance ---
    fichier_quittance = models.FileField(
        "Fichier quittance",
        upload_to=quittance_upload_path,
        blank=True,
        null=True,
        help_text="PDF généré automatiquement après validation du paiement"
    )

    date_creation = models.DateTimeField(
        "Date de création",
        auto_now_add=True
    )

    class Meta:
        db_table = "paiement"
        ordering = ["-date_creation"]
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"
        indexes = [
            models.Index(fields=["contrat", "date_echeance"]),
            models.Index(fields=["statut", "date_echeance"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(montant__gte=0),
                name="paiement_montant_positive"
            ),
            # Contrainte d'unicité : un seul paiement par couple (contrat, date_echeance)
            models.UniqueConstraint(
                fields=["contrat", "date_echeance"],
                name="paiement_unique_contrat_echeance",
            ),
            # Montant attendu positif ou nul
            models.CheckConstraint(
                check=models.Q(montant_attendu__gte=0) | models.Q(montant_attendu__isnull=True),
                name="paiement_montant_attendu_positive",
            ),
            # Montant payé positif ou nul
            models.CheckConstraint(
                check=models.Q(montant_paye__gte=0),
                name="paiement_montant_paye_positive",
            ),
        ]

    def __str__(self):
        return f"Paiement #{self.pk} — {self.contrat.bien.titre} ({self.get_statut_display()})"

    def clean(self):
        super().clean()

        # --- Référence obligatoire pour Mobile Money (uniquement si mode_paiement renseigné) ---
        if self.mode_paiement:
            mobile_money_modes = (self.ModePaiement.MVOLA, self.ModePaiement.ORANGE_MONEY, self.ModePaiement.AIRTEL_MONEY)
            if self.mode_paiement in mobile_money_modes and not self.reference:
                raise ValidationError({
                    "reference": "La référence de transaction est obligatoire pour les paiements par Mobile Money."
                })

        # --- Vérifier qu'il n'y a pas déjà un paiement validé pour la même échéance
        if not self.pk and not self.est_partiel:
            existing = Paiement.objects.filter(
                contrat=self.contrat,
                date_echeance=self.date_echeance,
                statut=Paiement.StatutPaiement.PAYE
            ).exists()
            if existing:
                raise ValidationError({
                    "date_echeance": "Un paiement complet a déjà été validé pour cette échéance."
                })

    def save(self, *args, **kwargs):
        # --- Synchronisation des dates ---
        if self.date_paiement_prevue:
            self.date_echeance = self.date_paiement_prevue
        elif self.date_echeance:
            self.date_paiement_prevue = self.date_echeance

        # --- Date de paiement automatique (remplie lors du passage à PAYE) ---
        if not self.date_paiement and self.statut == self.StatutPaiement.PAYE:
            self.date_paiement = timezone.now().date()

        # --- Date de versement partiel (remplie lors d'un paiement partiel) ---
        if self.est_partiel and not self.date_versement_partiel:
            self.date_versement_partiel = timezone.now().date()

        self.full_clean()
        super().save(*args, **kwargs)

    # --- Propriétés métier ---

    @property
    def locataire(self) -> Locataire:
        return self.contrat.locataire

    @property
    def nom_locataire(self) -> str:
        return self.contrat.locataire.user.get_full_name()

    @property
    def est_en_retard(self) -> bool:
        if self.statut == self.StatutPaiement.PAYE:
            # Historique du retard : un paiement payé en retard reste marqué.
            # Fallback sur aujourd'hui si date_paiement absente (lignes legacy
            # passées à PAYE sans date) au lieu de masquer le bandeau.
            date_reference = self.date_paiement or timezone.now().date()
            return (date_reference - self.date_echeance).days > 5
        else:
            return (timezone.now().date() - self.date_echeance).days > 5

    @property
    def montant_restant(self):
        """Montant restant à payer (pertinent pour les paiements partiels)."""
        if self.montant_attendu is not None:
            return max(self.montant_attendu - self.montant_paye, 0)
        return None

    @property
    def mois_echeance(self) -> str:
        """Retourne le mois de l'échéance sous forme lisible (ex: 'janvier 2026')."""
        MOIS_FR = [
            "", "janvier", "février", "mars", "avril", "mai", "juin",
            "juillet", "août", "septembre", "octobre", "novembre", "décembre"
        ]
        return f"{MOIS_FR[self.date_echeance.month]} {self.date_echeance.year}"

    @property
    def message_mois(self) -> str:
        """Message informatif sur le mois concerné par ce paiement."""
        return f"Ce paiement correspond au mois de {self.mois_echeance}."

    @property
    def est_mois_a_venir(self) -> bool:
        """Indique si cette facture correspond au mois à venir (mois suivant)."""
        if not self.date_echeance:
            return False
        annee_cible, mois_cible = get_mois_a_venir()
        return (self.date_echeance.year, self.date_echeance.month) == (annee_cible, mois_cible)

    @property
    def est_mois_passe(self) -> bool:
        """Indique si cette facture correspond à un mois passé par rapport au mois à venir."""
        if not self.date_echeance:
            return False
        annee_cible, mois_cible = get_mois_a_venir()
        return (self.date_echeance.year, self.date_echeance.month) < (annee_cible, mois_cible)

    @property
    def a_echeance_anterieure_impayee(self) -> bool:
        """Vérifie s'il existe une échéance antérieure non payée sur ce contrat."""
        if not self.date_echeance or not self.contrat_id:
            return False
        return Paiement.objects.filter(
            contrat_id=self.contrat_id,
            date_echeance__lt=self.date_echeance
        ).exclude(
            statut__in=[self.StatutPaiement.PAYE, self.StatutPaiement.ANNULE]
        ).exists()

    @property
    def a_demande_en_cours(self) -> bool:
        """Vérifie si une demande de paiement est déjà en cours (EN_ATTENTE) pour cette facture."""
        return self.demandes_paiement.filter(statut=DemandePaiement.StatutDemande.EN_ATTENTE).exists()

    @property
    def est_eligible_demande(self) -> bool:
        """
        Une facture est éligible à une demande de paiement si :
        - Elle a un statut en attente (non encore payée ni annulée)
        - Aucune facture antérieure n'est encore impayée sur ce contrat (règlement chronologique obligatoire)
        - Elle n'a pas déjà une demande en cours de validation
        """
        if self.statut in (self.StatutPaiement.PAYE, self.StatutPaiement.ANNULE):
            return False
        if self.a_demande_en_cours:
            return False
        if self.a_echeance_anterieure_impayee:
            return False
        return True

    # --- Actions métier ---

    def valider_paiement(self, *, save=True):
        if self.statut == self.StatutPaiement.PAYE:
            raise ValueError("Ce paiement est déjà validé.")
        self.statut = self.StatutPaiement.PAYE
        self.date_paiement = timezone.now().date()
        if save:
            self.save(update_fields=["statut", "date_paiement"])

    def annuler_paiement(self, *, save=True):
        if self.statut == self.StatutPaiement.PAYE:
            raise ValueError("Un paiement validé ne peut pas être annulé.")
        self.statut = self.StatutPaiement.ANNULE
        if save:
            self.save(update_fields=["statut"])


def get_mois_a_venir(reference_date=None):
    """
    Retourne le tuple (année, mois) du mois à venir (mois calendaire suivant).
    Exemple : si reference_date est en octobre 2026, retourne (2026, 11).
    """
    if reference_date is None:
        reference_date = timezone.now().date()
    annee = reference_date.year + (reference_date.month // 12)
    mois = (reference_date.month % 12) + 1
    return annee, mois


class DemandePaiement(models.Model):
    """
    Demande de paiement d'une facture mensuelle soumise par le locataire.
    Limitée exclusivement aux moyens de paiement Mobile Money.
    Autorisée uniquement pour la facture du mois à venir.
    """

    class MoyenPaiement(models.TextChoices):
        MVOLA = "MVOLA", "Mvola"
        ORANGE_MONEY = "ORANGE_MONEY", "Orange Money"
        AIRTEL_MONEY = "AIRTEL_MONEY", "Airtel Money"

    class StatutDemande(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        VALIDE = "VALIDE", "Validée"
        REFUSE = "REFUSE", "Refusée"
        ANNULE = "ANNULE", "Annulée"

    locataire = models.ForeignKey(
        Locataire,
        on_delete=models.PROTECT,
        related_name="demandes_paiement",
        verbose_name="Locataire demandeur",
    )
    facture = models.ForeignKey(
        Paiement,
        on_delete=models.PROTECT,
        related_name="demandes_paiement",
        verbose_name="Facture / Échéance concernée",
    )
    montant = models.DecimalField(
        "Montant à payer",
        max_digits=15,
        decimal_places=2,
        help_text="Montant exact de la facture",
    )
    date_demande = models.DateTimeField(
        "Date de demande",
        auto_now_add=True,
    )
    moyen_paiement = models.CharField(
        "Moyen de paiement",
        max_length=20,
        choices=MoyenPaiement.choices,
        help_text="Moyen de paiement Mobile Money (Mvola, Orange Money, Airtel Money)",
    )
    statut = models.CharField(
        "Statut de la demande",
        max_length=20,
        choices=StatutDemande.choices,
        default=StatutDemande.EN_ATTENTE,
        db_index=True,
    )
    telephone = models.CharField(
        "Numéro Mobile Money",
        max_length=20,
        blank=True,
        null=True,
        help_text="Numéro utilisé pour la transaction Mobile Money",
    )
    reference = models.CharField(
        "Référence de transaction",
        max_length=100,
        blank=True,
        null=True,
        help_text="Référence ou code de transaction Mobile Money",
    )
    date_traitement = models.DateTimeField(
        "Date de traitement",
        null=True,
        blank=True,
    )
    motif_refus = models.TextField(
        "Motif de refus",
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "demande_paiement"
        ordering = ["-date_demande"]
        verbose_name = "Demande de paiement"
        verbose_name_plural = "Demandes de paiement"
        indexes = [
            models.Index(fields=["locataire", "statut"]),
            models.Index(fields=["facture", "statut"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(montant__gte=0),
                name="demande_paiement_montant_positive",
            ),
        ]

    def __str__(self):
        nom = self.locataire.user.get_full_name() if self.locataire and self.locataire.user else "Locataire"
        return f"Demande #{self.pk} — {nom} ({self.get_statut_display()})"

    def clean(self):
        super().clean()

        # Validation stricte du moyen de paiement : uniquement Mobile Money
        if self.moyen_paiement and self.moyen_paiement not in self.MoyenPaiement.values:
            raise ValidationError({
                "moyen_paiement": "Le moyen de paiement doit être exclusivement Mobile Money (MVOLA, ORANGE_MONEY, AIRTEL_MONEY)."
            })

        if self.facture_id:
            facture = self.facture

            # 1. Vérification locataire
            if self.locataire_id and facture.contrat.locataire_id != self.locataire_id:
                raise ValidationError({
                    "facture": "Cette facture n'appartient pas au locataire spécifié."
                })

            # Les vérifications suivantes concernent la création d'une nouvelle demande
            if not self.pk:
                # 2. Facture déjà payée
                if facture.statut == Paiement.StatutPaiement.PAYE:
                    raise ValidationError({
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
                    raise ValidationError({
                        "facture": f"Vous devez d'abord régler votre facture la plus ancienne ({nom_mois}) avant de pouvoir payer celle-ci."
                    })

                # 4. Doublon : empêche une seconde demande si une demande est déjà en cours
                demandes_en_cours = DemandePaiement.objects.filter(
                    facture=facture,
                    statut=self.StatutDemande.EN_ATTENTE,
                )
                if demandes_en_cours.exists():
                    raise ValidationError({
                        "facture": "Une demande de paiement est déjà en cours pour cette facture."
                    })

            # 5. Montant correspond au montant réel de la facture
            montant_reel = facture.montant_attendu or facture.montant
            if self.montant is not None and montant_reel is not None and self.montant != montant_reel:
                raise ValidationError({
                    "montant": f"Le montant ({self.montant}) doit correspondre exactement au montant réel de la facture ({montant_reel})."
                })

    def save(self, *args, **kwargs):
        if self.facture_id and not self.locataire_id:
            self.locataire = self.facture.contrat.locataire
        if self.facture_id and self.montant is None:
            self.montant = self.facture.montant_attendu or self.facture.montant
        if kwargs.get("update_fields") is None:
            self.full_clean()
        super().save(*args, **kwargs)

    def valider(self, *, save=True):
        if self.statut == self.StatutDemande.VALIDE:
            raise ValueError("Cette demande est déjà validée.")
        self.statut = self.StatutDemande.VALIDE
        self.date_traitement = timezone.now()
        if save:
            self.save(update_fields=["statut", "date_traitement"])

    def refuser(self, motif="", *, save=True):
        if self.statut == self.StatutDemande.VALIDE:
            raise ValueError("Une demande validée ne peut pas être refusée.")
        self.statut = self.StatutDemande.REFUSE
        self.motif_refus = motif
        self.date_traitement = timezone.now()
        if save:
            self.save(update_fields=["statut", "motif_refus", "date_traitement"])
            if self.facture_id and self.facture.statut != Paiement.StatutPaiement.PAYE:
                self.facture.mode_paiement = None
                self.facture.reference = None
                self.facture.save()

    def annuler(self, *, save=True):
        if self.statut != self.StatutDemande.EN_ATTENTE:
            raise ValueError("Seule une demande en attente peut être annulée.")
        self.statut = self.StatutDemande.ANNULE
        self.date_traitement = timezone.now()
        if save:
            self.save(update_fields=["statut", "date_traitement"])
            if self.facture_id and self.facture.statut != Paiement.StatutPaiement.PAYE:
                self.facture.mode_paiement = None
                self.facture.reference = None
                self.facture.save()