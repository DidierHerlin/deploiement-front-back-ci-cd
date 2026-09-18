import logging
from io import BytesIO
from django.template.loader import render_to_string
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)


def formater_montant_ar(montant):
    if montant is None:
        return "0"
    try:
        valeur = int(float(montant))
        return f"{valeur:,}".replace(",", " ")
    except (ValueError, TypeError):
        return str(montant)


def generate_quittance_pdf(paiement):
    """
    Génère un PDF de quittance pour un paiement donné et le stocke
    dans le champ `fichier_quittance` du modèle Paiement.
    """
    # 1. Récupérer les données nécessaires
    contrat = paiement.contrat
    locataire = contrat.locataire
    proprietaire = contrat.bien.proprietaire
    bien = contrat.bien

    # Règle : Si PAYE/VALIDE -> on prend le loyer du contrat, sinon on prend le montant payé
    if paiement.statut in ['PAYE', 'VALIDE']:
        montant_effectif = contrat.loyer
    else:
        montant_effectif = paiement.montant_paye or paiement.montant or 0

    # 2. Construire le contexte pour le template
    context = {
        'paiement': paiement,
        'contrat': contrat,
        'locataire': locataire,
        'proprietaire': proprietaire,
        'bien': bien,
        'reference': paiement.reference or "N/A",
        'montant_format': formater_montant_ar(montant_effectif)
    }

    # 3. Rendre le template HTML
    try:
        html_string = render_to_string('paiement/quittance_template.html', context)
    except Exception as e:
        logger.error(f"Erreur lors du rendu du template : {e}")
        raise Exception(f"Erreur de template : {e}")

    # 4. Générer le PDF à partir du HTML
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html_string.encode('UTF-8')), result)

    if pdf.err:
        logger.error(f"Erreur lors de la génération du PDF : {pdf.err}")
        raise Exception("Erreur lors de la génération du PDF")

    # 5. Sauvegarder le PDF dans le champ FileField
    from django.core.files.base import ContentFile
    try:
        filename = f"quittance_{paiement.id}.pdf"
        content = ContentFile(result.getvalue())
        paiement.fichier_quittance.save(filename, content, save=True)
        logger.info(f"Quittance sauvegardée pour le paiement #{paiement.pk}")
        return paiement.fichier_quittance.name
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du fichier PDF : {e}")
        raise Exception(f"Erreur de sauvegarde : {e}")