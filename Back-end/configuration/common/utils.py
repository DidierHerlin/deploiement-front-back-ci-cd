import logging
from io import BytesIO
from django.template.loader import render_to_string
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)


def formater_montant_ar(montant) -> str:
    """Formatage standardisé des montants monétaires en Ariary."""
    if montant is None:
        return "0"
    try:
        valeur = int(float(montant))
        return f"{valeur:,}".replace(",", " ")
    except (ValueError, TypeError):
        return str(montant)


def render_to_pdf(template_src: str, context_dict: dict, raise_exceptions: bool = False) -> bytes | None:
    """
    Convertit un template Django en document PDF binaire via xhtml2pdf / pisa.
    Si raise_exceptions=True, lève une exception explicite en cas d'erreur de template ou de rendu.
    Sinon, log l'erreur et retourne None.
    """
    try:
        html_string = render_to_string(template_src, context_dict)
    except Exception as e:
        logger.error(f"Erreur lors du rendu du template : {e}")
        if raise_exceptions:
            raise Exception(f"Erreur de template : {e}")
        return None

    result = BytesIO()
    try:
        pdf = pisa.pisaDocument(BytesIO(html_string.encode("UTF-8")), result)
        if pdf.err:
            logger.error(f"Erreur lors de la génération du PDF : {pdf.err}")
            if raise_exceptions:
                raise Exception("Erreur lors de la génération du PDF")
            return None
        return result.getvalue()
    except Exception as e:
        logger.exception(f"Exception lors de la génération PDF : {e}")
        if raise_exceptions:
            raise
        return None


def defer_bien_photos(queryset, prefix: str = ""):
    """
    Diffère le chargement du champ volumineux 'photos' du modèle Bien.
    Ex: defer_bien_photos(Bien.objects.all()) -> .defer('photos')
        defer_bien_photos(Contrat.objects.all(), 'bien') -> .defer('bien__photos')
    """
    field = f"{prefix}__photos" if prefix else "photos"
    return queryset.defer(field)
