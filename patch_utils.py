# -*- coding: utf-8 -*-
import codecs

content = """import logging
from io import BytesIO
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from .models import Paiement

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
    # 1. Récupérer les données nécessaires
    contrat = paiement.contrat
    locataire = contrat.locataire
    proprietaire = contrat.bien.proprietaire
    bien = contrat.bien

    # Règle : Si PAYE/VALIDE -> on prend le loyer du contrat, sinon on prend le montant payé
    if paiement.statut in ['PAYE', 'VALIDE']:
        loyer_effectif = contrat.loyer or 0
    else:
        loyer_effectif = paiement.montant_paye or paiement.montant or 0

    # Vérifier s'il s'agit du premier paiement
    premier_paiement = Paiement.objects.filter(contrat=contrat).order_by('date_echeance', 'id').first()
    is_premier = (premier_paiement and premier_paiement.id == paiement.id)

    # Ajouter le dépôt de garantie pour le premier paiement
    depot_garantie = contrat.depot_garantie if (is_premier and contrat.type_contrat == 'LOCATION') else 0

    try:
        total = float(loyer_effectif) + float(depot_garantie or 0)
    except (ValueError, TypeError):
        total = 0

    # 2. Construire le contexte pour le template
    context = {
        'paiement': paiement,
        'contrat': contrat,
        'locataire': locataire,
        'proprietaire': proprietaire,
        'bien': bien,
        'reference': paiement.reference or "N/A",
        'loyer_format': formater_montant_ar(loyer_effectif),
        'depot_garantie_format': formater_montant_ar(depot_garantie) if depot_garantie else None,
        'montant_format': formater_montant_ar(total)
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
        content_file = ContentFile(result.getvalue())
        paiement.fichier_quittance.save(filename, content_file, save=True)
        logger.info(f"Quittance sauvegardée pour le paiement #{paiement.pk}")
        return paiement.fichier_quittance.name
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du fichier PDF : {e}")
        raise Exception(f"Erreur de sauvegarde : {e}")
"""

with codecs.open(r'Back-end\configuration\paiement\utils.py', 'w', 'utf-8') as f:
    f.write(content)

print("SUCCESS UTILS")
