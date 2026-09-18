"""Signaux de l'application paiement.

Contient :
- Génération automatique de quittance (RG-16) sur Paiement
- Mise à jour automatique du statut EN_RETARD (RG-15) sur Paiement
- Génération automatique de l'échéancier de paiements sur Contrat (post_save)
  · Location : règles premier mois (loyer + dépôt + frais agence) / mois suivants (loyer + frais agence)
  · Achat    : comptant (1 échéance) ou échelonné (50 % + 5 × 10 % avec frais agence)
- Annulation des échéances futures lors de résiliation/terminaison d'un Contrat
"""

import calendar
import logging
from datetime import date
from decimal import Decimal

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from contrats.models import Contrat

from .models import Paiement
from .utils import generate_quittance_pdf

logger = logging.getLogger(__name__)

# Taux des frais d'agence (10 % du loyer ou du prix)
TAUX_FRAIS_AGENCE = Decimal("0.10")


# ──────────────────────────────────────────────────────────────────────────────
# Signaux existants — post_save sur Paiement
# ──────────────────────────────────────────────────────────────────────────────


@receiver(post_save, sender=Paiement)
def generer_quittance_apres_validation(sender, instance: Paiement, **kwargs):
    """
    RG-16 : Génère automatiquement une quittance lorsque le paiement passe à PAYE.
    Le PDF est stocké dans le champ fichier_quittance du modèle.
    """
    # Vérifier que le paiement est validé ET que la quittance n'existe pas encore
    if instance.statut == Paiement.StatutPaiement.PAYE and not instance.fichier_quittance:
        try:
            generate_quittance_pdf(instance)
            logger.info(f"Quittance générée avec succès pour le paiement #{instance.pk}")
        except Exception as e:
            logger.error(
                f"Erreur lors de la génération de la quittance pour le paiement #{instance.pk}: {str(e)}"
            )


@receiver(post_save, sender=Paiement)
def mettre_a_jour_statut_bien_apres_paiement(sender, instance: Paiement, **kwargs):
    """
    Si un paiement d'un contrat est validé (PAYE),
    le statut du bien est mis à jour selon le type de contrat.
    LOCATION -> LOUE
    ACHAT -> VENDU
    """
    if instance.statut == Paiement.StatutPaiement.PAYE:
        contrat = instance.contrat
        from bien.models import Bien
        bien = contrat.bien
        
        if contrat.type_contrat == Contrat.TypeContrat.ACHAT:
            # Passer le contrat en VENDU
            if contrat.statut in (Contrat.StatutContrat.ACTIF, Contrat.StatutContrat.RESERVE):
                contrat.statut = Contrat.StatutContrat.VENDU
                contrat.save(update_fields=["statut"])
                logger.info(f"Contrat #{contrat.pk} passé en VENDU suite au premier paiement.")
            
            # Passer le bien en VENDU
            if bien.statut == Bien.StatutBien.RESERVE:
                bien.statut = Bien.StatutBien.VENDU
                bien.save(update_fields=["statut"])
                logger.info(f"Bien #{bien.pk} passé en VENDU suite au premier paiement du contrat #{contrat.pk}.")
                
        elif contrat.type_contrat == Contrat.TypeContrat.LOCATION:
            # Passer le bien en LOUE
            if bien.statut == Bien.StatutBien.RESERVE:
                bien.statut = Bien.StatutBien.LOUE
                bien.save(update_fields=["statut"])
                logger.info(f"Bien #{bien.pk} passé en LOUE suite au premier paiement du contrat #{contrat.pk}.")


@receiver(post_save, sender=Paiement)
def mettre_a_jour_statut_retard(sender, instance: Paiement, **kwargs):
    """
    RG-15 : Met à jour automatiquement le statut EN_RETARD si nécessaire.
    """
    # Ne pas modifier le statut si déjà PAYE ou ANNULE
    if instance.statut in (Paiement.StatutPaiement.PAYE, Paiement.StatutPaiement.ANNULE):
        return

    # Vérifier si le paiement est en retard
    if instance.est_en_retard:
        if instance.statut != Paiement.StatutPaiement.EN_RETARD:
            instance.statut = Paiement.StatutPaiement.EN_RETARD
            instance.save(update_fields=["statut"])
            logger.info(
                f"Paiement #{instance.pk} automatiquement passé en EN_RETARD "
                f"(échéance: {instance.date_echeance}, aujourd'hui: {timezone.now().date()})"
            )
    else:
        # Si le paiement n'est plus en retard, on le remet en attente (sauf si déjà payé)
        if instance.statut == Paiement.StatutPaiement.EN_RETARD:
            instance.statut = Paiement.StatutPaiement.EN_ATTENTE
            instance.save(update_fields=["statut"])
            logger.info(f"Paiement #{instance.pk} repassé en EN_ATTENTE (retard résolu)")


# ──────────────────────────────────────────────────────────────────────────────
# Utilitaire — gestion des dates sans dépendance externe
# ──────────────────────────────────────────────────────────────────────────────


def _ajouter_un_mois(date_courante: date) -> date:
    """Ajoute un mois à une date en gérant correctement les fins de mois.

    Exemples :
        31 janvier → 28 (ou 29) février
        31 mars    → 30 avril
        28 février → 28 mars

    Utilise ``calendar.monthrange`` de la bibliothèque standard
    (aucune dépendance externe type ``python-dateutil``).
    """
    annee = date_courante.year + (date_courante.month // 12)
    mois = (date_courante.month % 12) + 1
    dernier_jour_du_mois = calendar.monthrange(annee, mois)[1]
    jour = min(date_courante.day, dernier_jour_du_mois)
    return date_courante.replace(year=annee, month=mois, day=jour)


# ──────────────────────────────────────────────────────────────────────────────
# Signal — post_save sur Contrat : génération/annulation de l'échéancier
# ──────────────────────────────────────────────────────────────────────────────


def _paiement_base(contrat: Contrat, **kwargs) -> Paiement:
    """Construit un objet Paiement sans le sauvegarder.

    Note : mode_paiement est volontairement absent (null) — il sera renseigné
    uniquement au moment de l'enregistrement réel du paiement.
    """
    date_echeance = kwargs.get('date_echeance')
    return Paiement(
        contrat=contrat,
        montant_paye=0,
        statut=Paiement.StatutPaiement.EN_ATTENTE,
        mode_paiement=None,   # ← toujours null lors de la génération automatique
        est_partiel=False,
        date_paiement_prevue=date_echeance,
        **kwargs,
    )


def generer_echeancier_location(contrat: Contrat) -> None:
    """Génère l'échéancier de paiements pour un contrat de LOCATION actif.

    Règles métier :
    ─ Premier mois  : loyer + dépôt de garantie + frais d'agence (10 % du loyer)
    ─ Mois suivants : loyer + frais d'agence (10 % du loyer)

    Idempotence : si des paiements existent déjà, on ne régénère rien.
    Utilise ``bulk_create()`` pour la performance.
    """
    if Paiement.objects.filter(contrat=contrat).exists():
        logger.debug(
            "Échéancier déjà existant pour le contrat #%s — aucune génération.", contrat.pk
        )
        return

    loyer = contrat.loyer
    depot = contrat.depot_garantie or Decimal("0")
    frais_agence = (loyer * TAUX_FRAIS_AGENCE).quantize(Decimal("0.01"))

    echeances = []
    date_courante = contrat.date_debut
    num = 1

    while date_courante < contrat.date_fin:
        if num == 1:
            # Premier mois : loyer + dépôt de garantie
            montant = loyer + depot
        else:
            # Mois suivants : loyer
            montant = loyer

        echeances.append(
            _paiement_base(
                contrat=contrat,
                date_echeance=date_courante,
                montant_attendu=montant,
                montant=montant,
                num_echeance=num,
            )
        )
        date_courante = _ajouter_un_mois(date_courante)
        num += 1

    if echeances:
        Paiement.objects.bulk_create(echeances)
        logger.info(
            "Échéancier LOCATION généré pour le contrat #%s : %d échéance(s) créée(s).",
            contrat.pk,
            len(echeances),
        )


def generer_echeancier_achat(contrat: Contrat, *, mode: str = "echelonne") -> None:
    """Génère l'échéancier de paiements pour un contrat d'ACHAT actif.

    Deux modes possibles :

    ``comptant``  — Une seule échéance couvrant l'intégralité du prix (100%).
    ``echelonne`` — Paiement en 6 échéances :
        · Échéance 1 : 50 % du prix
        · Échéances 2 à 6 : 10 % du prix
        Les dates sont générées à partir de date_creation.
    Idempotence : si des paiements existent déjà, on ne régénère rien.
    """
    if Paiement.objects.filter(contrat=contrat).exists():
        logger.debug(
            "Échéancier déjà existant pour le contrat #%s — aucune génération.", contrat.pk
        )
        return

    prix = contrat.prix
    echeances = []
    # La date de base est la date de création du contrat
    date_courante = contrat.date_creation.date()

    if mode == "comptant":
        # Paiement comptant : 100 % du prix
        echeances.append(
            _paiement_base(
                contrat=contrat,
                date_echeance=date_courante,
                montant_attendu=prix,
                montant=prix,
                num_echeance=1,
            )
        )
    else:
        # Paiement échelonné : 50 % + 5 × 10 %
        montant_premier = (prix * Decimal("0.50")).quantize(Decimal("0.01"))
        echeances.append(
            _paiement_base(
                contrat=contrat,
                date_echeance=date_courante,
                montant_attendu=montant_premier,
                montant=montant_premier,
                num_echeance=1,
            )
        )
        date_courante = _ajouter_un_mois(date_courante)

        montant_mensualite = (prix * Decimal("0.10")).quantize(Decimal("0.01"))
        for num in range(2, 7):
            echeances.append(
                _paiement_base(
                    contrat=contrat,
                    date_echeance=date_courante,
                    montant_attendu=montant_mensualite,
                    montant=montant_mensualite,
                    num_echeance=num,
                )
            )
            date_courante = _ajouter_un_mois(date_courante)

    if echeances:
        Paiement.objects.bulk_create(echeances)
        logger.info(
            "Échéancier ACHAT (%s) généré pour le contrat #%s : %d échéance(s) créée(s).",
            mode,
            contrat.pk,
            len(echeances),
        )
        
        # Passage du bien en RESERVE si des paiements EN_ATTENTE ont été générés
        from bien.models import Bien
        bien = contrat.bien
        if bien.statut == Bien.StatutBien.DISPONIBLE:
            bien.statut = Bien.StatutBien.RESERVE
            bien.save(update_fields=["statut"])
            logger.info(
                "Bien #%s passé en RESERVE (contrat d'achat #%s avec paiements EN_ATTENTE).",
                bien.pk,
                contrat.pk,
            )


# Alias rétrocompatibilité — l'ancienne fonction est désormais remplacée
# par generer_echeancier_location. On la conserve pour ne pas casser
# les imports existants éventuels.
def generer_echeancier(contrat: Contrat) -> None:
    """Alias vers generer_echeancier_location (rétrocompatibilité)."""
    generer_echeancier_location(contrat)


def annuler_echeances_futures(contrat: Contrat) -> None:
    """Annule (statut → ANNULE) les échéances EN_ATTENTE d'un contrat résilié/terminé.

    Comportement par défaut activé lors du passage du contrat à RESILIE ou TERMINE.
    Seules les échéances dont le statut est encore EN_ATTENTE sont touchées ;
    les paiements déjà PAYE ou EN_RETARD restent inchangés.
    """
    nombre_annule = Paiement.objects.filter(
        contrat=contrat,
        statut=Paiement.StatutPaiement.EN_ATTENTE,
    ).update(statut=Paiement.StatutPaiement.ANNULE)

    if nombre_annule:
        logger.info(
            "Contrat #%s résilié/terminé : %d échéance(s) EN_ATTENTE passée(s) à ANNULE.",
            contrat.pk,
            nombre_annule,
        )


@receiver(post_save, sender=Contrat)
def generer_echeancier_contrat(sender, instance: Contrat, **kwargs) -> None:
    """Récepteur post_save sur Contrat — orchestre la génération ou l'annulation
    de l'échéancier de paiements.

    Déclencheur → Contrat (modèle source de l'événement)
    Modèle modifié → Paiement (lignes créées ou mises à jour)

    Cas traités :
    1. Contrat LOCATION + ACTIF  → génération de l'échéancier location (idempotent).
    2. Contrat LOCATION + RESILIE/TERMINE → annulation des échéances en attente.
    3. Contrat ACHAT   + ACTIF  → génération de l'échéancier achat échelonné (idempotent).
       (Pour un paiement comptant, la vue/API devra appeler generer_echeancier_achat(mode='comptant').)
    4. Contrat ACHAT   + VENDU  → annulation des échéances en attente.
    """
    if instance.statut == Contrat.StatutContrat.ACTIF and instance.type_contrat == Contrat.TypeContrat.LOCATION:
        # Cas 1 : contrat de location actif → génération de l'échéancier location
        generer_echeancier_location(instance)
    elif instance.statut in (Contrat.StatutContrat.ACTIF, Contrat.StatutContrat.RESERVE) and instance.type_contrat == Contrat.TypeContrat.ACHAT:
        # Cas 3 : contrat d'achat (actif ou réservé) → génération de l'échéancier achat
        mode = "comptant" if instance.type_paiement_achat == Contrat.TypePaiementAchat.TOTALITE else "echelonne"
        generer_echeancier_achat(instance, mode=mode)

    elif instance.statut in (
        Contrat.StatutContrat.RESILIE,
        Contrat.StatutContrat.TERMINE,
        Contrat.StatutContrat.VENDU,
    ):
        # Cas 2 / 4 : contrat terminé → annulation des échéances futures
        annuler_echeances_futures(instance)