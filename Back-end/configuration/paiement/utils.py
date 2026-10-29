import logging
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

    # Formatage propre du bien concerné et de son adresse (évite parenthèses vides et virgule superflue)
    titre_bien = (getattr(bien, 'titre', '') or '').strip()
    adresse_raw = (getattr(bien, 'adresse', '') or '').strip()
    ville_raw = (getattr(bien, 'ville', '') or '').strip() if hasattr(bien, 'ville') else ''

    adresse_clean = adresse_raw.rstrip(',').strip()
    ville_clean = ville_raw.rstrip(',').strip()

    if ville_clean and ville_clean.lower() not in adresse_clean.lower():
        adresse_propre = f"{adresse_clean}, {ville_clean}" if adresse_clean else ville_clean
    else:
        adresse_propre = adresse_clean or "Adresse non renseignée"
    adresse_propre = adresse_propre.rstrip(',').strip()

    # Désignation du bien sans parenthèses vides ()
    if adresse_propre and adresse_propre != "Adresse non renseignée" and adresse_propre.lower() not in titre_bien.lower():
        bien_designation = f"{titre_bien} — {adresse_propre}"
    else:
        type_display = bien.get_type_display() if hasattr(bien, 'get_type_display') else ""
        if type_display and type_display.lower() not in titre_bien.lower():
            bien_designation = f"{titre_bien} — {type_display}"
        else:
            bien_designation = titre_bien or "Bien immobilier"

    # Formatage soigné des périodes et dates en français
    MOIS_FR = {
        1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
        5: "Mai", 6: "Juin", 7: "Juillet", 8: "Août",
        9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre"
    }
    date_echeance = paiement.date_echeance
    if date_echeance:
        periode_nom = f"{MOIS_FR.get(date_echeance.month, '')} {date_echeance.year}".strip()
        date_echeance_str = date_echeance.strftime("%d/%m/%Y")
    else:
        periode_nom = "Période en cours"
        date_echeance_str = "-"

    date_paiement = paiement.date_paiement
    if date_paiement:
        date_paiement_str = date_paiement.strftime("%d/%m/%Y")
    else:
        date_paiement_str = date_echeance_str

    from django.utils import timezone
    try:
        date_generation = timezone.localtime(timezone.now()).strftime("%d/%m/%Y à %H:%M")
    except Exception:
        date_generation = timezone.now().strftime("%d/%m/%Y à %H:%M")

    # Coordonnées des parties
    locataire_user = getattr(locataire, 'user', None)
    locataire_nom = locataire_user.get_full_name() if locataire_user else "Locataire"
    locataire_email = locataire_user.email if locataire_user else ""
    locataire_tel = getattr(locataire_user, 'telephone', '') or getattr(locataire, 'contact', '') or ''

    proprietaire_user = getattr(proprietaire, 'user', None)
    proprietaire_nom = proprietaire_user.get_full_name() if proprietaire_user else "Propriétaire"
    proprietaire_email = proprietaire_user.email if proprietaire_user else ""
    proprietaire_tel = getattr(proprietaire_user, 'telephone', '') or getattr(proprietaire, 'contact', '') or ''

    mode_paiement_display = paiement.get_mode_paiement_display() if hasattr(paiement, 'get_mode_paiement_display') else "Mobile Money"

    # 2. Construire le contexte enrichi pour le template
    context = {
        'paiement': paiement,
        'contrat': contrat,
        'locataire': locataire,
        'locataire_nom': locataire_nom,
        'locataire_email': locataire_email,
        'locataire_tel': locataire_tel,
        'proprietaire': proprietaire,
        'proprietaire_nom': proprietaire_nom,
        'proprietaire_email': proprietaire_email,
        'proprietaire_tel': proprietaire_tel,
        'bien': bien,
        'bien_designation': bien_designation,
        'adresse_propre': adresse_propre,
        'periode_nom': periode_nom,
        'date_echeance_str': date_echeance_str,
        'date_paiement_str': date_paiement_str,
        'date_generation': date_generation,
        'mode_paiement_display': mode_paiement_display,
        'reference': paiement.reference or "Non renseignée",
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
