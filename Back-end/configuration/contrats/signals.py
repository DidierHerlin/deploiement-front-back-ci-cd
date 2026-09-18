import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from bien.models import Bien

from .models import Contrat

logger = logging.getLogger(__name__)


def _appliquer_statut_si_change(bien: Bien, nouveau_statut: str, message: str, *args) -> None:
    if bien.statut == nouveau_statut:
        return
    bien.statut = nouveau_statut
    bien.save(update_fields=["statut"])
    logger.info(message, *args)


def mettre_a_jour_statut_bien(bien: Bien) -> None:
    if bien.statut == Bien.StatutBien.VENDU:
        return

    # Filtre défensif sur type_contrat=LOCATION : redondant avec le
    # CheckConstraint qui interdit à un contrat ACHAT d'être ACTIF, mais
    # rend l'intention explicite sans obliger à consulter models.py.
    a_un_contrat_actif = Contrat.objects.filter(
        bien=bien,
        type_contrat=Contrat.TypeContrat.LOCATION,
        statut=Contrat.StatutContrat.ACTIF,
    ).exists()

    if a_un_contrat_actif:
        nouveau_statut = Bien.StatutBien.LOUE
    elif bien.statut != Bien.StatutBien.EN_TRAVAUX:
        nouveau_statut = Bien.StatutBien.DISPONIBLE
    else:
        nouveau_statut = bien.statut

    _appliquer_statut_si_change(
        bien, nouveau_statut, "Bien #%s -> %s (mise à jour après contrat)", bien.pk, nouveau_statut
    )


@receiver(post_save, sender=Contrat)
def synchroniser_bien_apres_sauvegarde_contrat(sender, instance: Contrat, **kwargs) -> None:
    bien = instance.bien
    if bien.statut == Bien.StatutBien.VENDU:
        return

    if instance.type_contrat == Contrat.TypeContrat.LOCATION:
        if instance.statut == Contrat.StatutContrat.ACTIF:
            # Tant qu'aucun paiement n'est validé, le bien doit rester RESERVE.
            # Il passera en LOUE lors du premier paiement.
            _appliquer_statut_si_change(
                bien, Bien.StatutBien.RESERVE, "Bien #%s -> RESERVE (contrat actif #%s)", bien.pk, instance.pk
            )
        elif instance.statut in (Contrat.StatutContrat.RESILIE, Contrat.StatutContrat.TERMINE):
            mettre_a_jour_statut_bien(bien)

    elif instance.type_contrat == Contrat.TypeContrat.ACHAT:
        if instance.statut == Contrat.StatutContrat.VENDU:
            _appliquer_statut_si_change(
                bien, Bien.StatutBien.VENDU, "Bien #%s -> VENDU (vente finalisée #%s)", bien.pk, instance.pk
            )


@receiver(post_delete, sender=Contrat)
def synchroniser_bien_apres_suppression_contrat(sender, instance: Contrat, **kwargs) -> None:
    mettre_a_jour_statut_bien(instance.bien)