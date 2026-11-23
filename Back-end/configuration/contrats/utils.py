import logging
from datetime import date
from decimal import Decimal
from io import BytesIO
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from .models import Contrat
from common.utils import formater_montant_ar

logger = logging.getLogger(__name__)


def generate_contrat_pdf(contrat: Contrat) -> bytes | bool:
    if contrat.type_contrat == Contrat.TypeContrat.LOCATION:
        context = {
            "contrat": contrat,
            "loyer_format": formater_montant_ar(contrat.loyer),
            "depot_format": formater_montant_ar(contrat.depot_garantie),
        }
        template_name = "contrats/contrat_bail.html"

    elif contrat.type_contrat == Contrat.TypeContrat.ACHAT:
        prix = Decimal(str(contrat.prix or 0))
        paiements = list(contrat.paiements.all().order_by("num_echeance", "date_echeance"))
        echeances = []
        total_echeances = Decimal("0")

        if paiements:
            for p in paiements:
                montant = Decimal(str(p.montant_attendu or p.montant or 0))
                total_echeances += montant
                pct = ""
                if prix > Decimal("0"):
                    ratio = (montant / prix) * 100
                    pct = f"{ratio:.0f} %"
                echeances.append({
                    "numero": p.num_echeance or (len(echeances) + 1),
                    "date": p.date_echeance or p.date_paiement_prevue,
                    "montant": montant,
                    "montant_format": formater_montant_ar(montant),
                    "pourcentage": pct,
                    "statut": p.get_statut_display() if hasattr(p, "get_statut_display") else str(p.statut),
                })
        else:
            # Fallback lorsque les échéances ne sont pas encore créées en BDD
            date_base = contrat.date_debut or getattr(contrat, "date_creation", None)
            if hasattr(date_base, "date"):
                date_base = date_base.date()
            if not date_base:
                date_base = date.today()

            from paiement.signals import _ajouter_un_mois
            if contrat.type_paiement_achat == Contrat.TypePaiementAchat.TOTALITE:
                total_echeances = prix
                echeances.append({
                    "numero": 1,
                    "date": date_base,
                    "montant": prix,
                    "montant_format": formater_montant_ar(prix),
                    "pourcentage": "100 %",
                    "statut": "En attente",
                })
            else:
                m1 = (prix * Decimal("0.50")).quantize(Decimal("0.01"))
                total_echeances += m1
                echeances.append({
                    "numero": 1,
                    "date": date_base,
                    "montant": m1,
                    "montant_format": formater_montant_ar(m1),
                    "pourcentage": "50 %",
                    "statut": "En attente",
                })
                d = _ajouter_un_mois(date_base)
                m_mensuel = (prix * Decimal("0.10")).quantize(Decimal("0.01"))
                for num in range(2, 7):
                    total_echeances += m_mensuel
                    echeances.append({
                        "numero": num,
                        "date": d,
                        "montant": m_mensuel,
                        "montant_format": formater_montant_ar(m_mensuel),
                        "pourcentage": "10 %",
                        "statut": "En attente",
                    })
                    d = _ajouter_un_mois(d)

        mode_reglement = (
            "Paiement comptant (intégralité du prix à la conclusion)"
            if contrat.type_paiement_achat == Contrat.TypePaiementAchat.TOTALITE
            else "Paiement échelonné (1ère tranche de 50 %, suivie de 5 tranches de 10 %)"
        )

        context = {
            "contrat": contrat,
            "prix_format": formater_montant_ar(prix),
            "total_echeances_format": formater_montant_ar(total_echeances),
            "total_echeances_conforme": (total_echeances == prix),
            "mode_reglement": mode_reglement,
            "echeances": echeances,
            "est_echelonne": (contrat.type_paiement_achat == Contrat.TypePaiementAchat.PARTIEL),
        }
        template_name = "contrats/contrat_vente.html"
    else:
        logger.error(f"Le contrat {contrat.pk} a un type non reconnu : {contrat.type_contrat}")
        return False

    try:
        html_string = render_to_string(template_name, context)
        pdf_file = BytesIO()
        pisa_status = pisa.CreatePDF(html_string, dest=pdf_file)

        if pisa_status.err:
            logger.error(f"Erreur lors de la génération PDF du contrat {contrat.pk}")
            return False

        return pdf_file.getvalue()

    except Exception as e:
        logger.exception(f"Exception lors de la génération PDF du contrat {contrat.pk}: {e}")
        return False
