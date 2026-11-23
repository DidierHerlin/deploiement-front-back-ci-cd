import calendar
import logging
from datetime import date
from decimal import Decimal

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from contrats.models import Contrat

from .models import Paiement
from .utils import generate_quittance_pdf

logger = logging.getLogger(__name__)

# Taux des frais d'agence (10 % du loyer ou du prix)
TAUX_FRAIS_AGENCE = Decimal("0.10")


# Generation automatique de la quittance apres paiement


@receiver(post_save, sender=Paiement)
def generer_quittance_apres_validation(sender, instance: Paiement, **kwargs):
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
    update_fields = kwargs.get("update_fields")
    if update_fields is not None and "statut" not in update_fields:
        return

    if instance.statut == Paiement.StatutPaiement.PAYE:
        contrat = instance.contrat
        from bien.models import Bien
        bien = contrat.bien
        
        if contrat.type_contrat == Contrat.TypeContrat.ACHAT:
            # Vérifier si l'intégralité du prix de vente a été réglée
            total_paye = contrat.paiements.filter(
                statut=Paiement.StatutPaiement.PAYE
            ).aggregate(models.Sum('montant_paye'))['montant_paye__sum'] or Decimal("0")

            unpaid_exists = contrat.paiements.filter(
                statut__in=[Paiement.StatutPaiement.EN_ATTENTE, Paiement.StatutPaiement.EN_RETARD]
            ).exclude(pk=instance.pk).exists()

            if not unpaid_exists and total_paye >= contrat.prix:
                # Vente finalisée : passer le contrat et le bien en VENDU
                if contrat.statut != Contrat.StatutContrat.VENDU:
                    contrat.statut = Contrat.StatutContrat.VENDU
                    contrat.save(update_fields=["statut"])
                    logger.info(f"Contrat #{contrat.pk} passé en VENDU suite au règlement intégral.")
                
                if bien.statut != Bien.StatutBien.VENDU:
                    bien.changer_statut(Bien.StatutBien.VENDU, motif=f"règlement intégral du contrat #{contrat.pk}")
            else:
                # Échéances restantes : le contrat reste ACTIF et le bien reste RESERVE
                if contrat.statut not in (Contrat.StatutContrat.ACTIF, Contrat.StatutContrat.VENDU):
                    contrat.statut = Contrat.StatutContrat.ACTIF
                    contrat.save(update_fields=["statut"])
                    logger.info(f"Contrat #{contrat.pk} maintenu en ACTIF (échéances restantes).")
                
                if bien.statut == Bien.StatutBien.DISPONIBLE:
                    bien.changer_statut(Bien.StatutBien.RESERVE, motif=f"tranche du contrat #{contrat.pk}")
                
        elif contrat.type_contrat == Contrat.TypeContrat.LOCATION:
            # Passer le bien en LOUE
            if bien.statut == Bien.StatutBien.RESERVE:
                bien.changer_statut(Bien.StatutBien.LOUE, motif=f"premier paiement du contrat #{contrat.pk}")


@receiver(post_save, sender=Paiement)
def mettre_a_jour_statut_retard(sender, instance: Paiement, **kwargs):
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


# Utilitaire de calcul de date sans dependance externe


def _ajouter_un_mois(date_courante: date) -> date:
    annee = date_courante.year + (date_courante.month // 12)
    mois = (date_courante.month % 12) + 1
    dernier_jour_du_mois = calendar.monthrange(annee, mois)[1]
    jour = min(date_courante.day, dernier_jour_du_mois)
    return date_courante.replace(year=annee, month=mois, day=jour)


# Signal post_save sur Contrat pour la gestion de l'echeancier


def _paiement_base(contrat: Contrat, **kwargs) -> Paiement:
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
    if Paiement.objects.filter(contrat=contrat).exists():
        logger.debug(
            "Échéancier déjà existant pour le contrat #%s — aucune génération.", contrat.pk
        )
        return

    prix = contrat.prix
    echeances = []
    # La date de base est la date d'achat (date_debut) ou à défaut la date de création
    date_courante = contrat.date_debut or (contrat.date_creation.date() if contrat.date_creation else timezone.now().date())

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
    ):
        # Cas 2 : contrat résilié ou terminé → annulation des échéances futures
        annuler_echeances_futures(instance)