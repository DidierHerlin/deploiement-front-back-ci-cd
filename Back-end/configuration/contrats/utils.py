import logging
from io import BytesIO
from django.template.loader import render_to_string
from django.core.files.base import ContentFile
from xhtml2pdf import pisa
from .models import Contrat

logger = logging.getLogger(__name__)

from common.utils import formater_montant_ar, render_to_pdf

def generate_contrat_pdf(contrat: Contrat) -> bool:
    """
    Génère un contrat de bail en PDF pour un contrat de location
    et le sauvegarde dans le champ document_pdf (ou crée un vrai fichier).
    """
    if contrat.type_contrat != Contrat.TypeContrat.LOCATION:
        logger.error(f"Le contrat {contrat.pk} n'est pas une location.")
        return False

    context = {
        "contrat": contrat,
        "loyer_format": formater_montant_ar(contrat.loyer),
        "depot_format": formater_montant_ar(contrat.depot_garantie),
    }

    try:
        html_string = render_to_string("contrats/contrat_bail.html", context)
        pdf_file = BytesIO()
        pisa_status = pisa.CreatePDF(html_string, dest=pdf_file)

        if pisa_status.err:
            logger.error(f"Erreur lors de la génération PDF du contrat {contrat.pk}")
            return False

        # Si votre modèle Contrat n'a qu'un CharField 'document_pdf' au lieu d'un FileField,
        # vous devrez peut-être stocker ce fichier manuellement ou changer de champ.
        # Toutefois, comme le backend gère ce document dynamiquement à la volée, on peut simplement
        # retourner les bytes et servir la réponse directement depuis la vue.
        
        return pdf_file.getvalue()
        
    except Exception as e:
        logger.exception(f"Exception lors de la génération PDF du contrat {contrat.pk}: {e}")
        return False
