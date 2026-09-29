from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta

from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from utilisateur.models import Utilisateur


class AgentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in [Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT]:
            return Response({"detail": "Non autorisé."}, status=403)

        # 1. Biens Stats (1 seule requête agrégée)
        biens_stats = Bien.objects.aggregate(
            total=Count('id'),
            dispo=Count('id', filter=Q(statut=Bien.StatutBien.DISPONIBLE)),
            loue=Count('id', filter=Q(statut=Bien.StatutBien.LOUE)),
            travaux=Count('id', filter=Q(statut=Bien.StatutBien.EN_TRAVAUX))
        )

        # 2. Revenus Stats
        now = timezone.now()
        current_month = now.month
        current_year = now.year
        last_month = 12 if current_month == 1 else current_month - 1
        year_of_last_month = current_year - 1 if current_month == 1 else current_year

        # Utiliser contrat__loyer (FK réelle) plutôt qu'une @property
        paiements_payes = Paiement.objects.filter(
            statut=Paiement.StatutPaiement.PAYE,
            date_paiement__isnull=False
        )

        rev_current = paiements_payes.filter(
            date_paiement__month=current_month,
            date_paiement__year=current_year
        ).aggregate(total=Sum('montant_paye'))['total'] or 0

        rev_last = paiements_payes.filter(
            date_paiement__month=last_month,
            date_paiement__year=year_of_last_month
        ).aggregate(total=Sum('montant_paye'))['total'] or 0

        # Chart Data : grouper par mois en Python (pas de GROUP BY mois natif cross-DB)
        revenues_by_month = {}
        for p in paiements_payes.values('date_paiement', 'montant_paye'):
            month_key = p['date_paiement'].strftime('%b %Y')
            revenues_by_month[month_key] = revenues_by_month.get(month_key, 0) + float(p['montant_paye'] or 0)

        chart_data = [{"name": k, "Revenus": v} for k, v in revenues_by_month.items()]

        revenus_stats = {
            'currentMonth': float(rev_current),
            'lastMonth': float(rev_last),
            'chartData': chart_data
        }

        # 3. Impayés Stats & Arrears
        limit = now.date() - timedelta(days=5)
        arrears_qs = Paiement.objects.exclude(
            statut__in=[Paiement.StatutPaiement.PAYE, Paiement.StatutPaiement.ANNULE]
        ).filter(
            date_echeance__lt=limit
        ).select_related('contrat__locataire__user', 'contrat__bien')

        # Somme du montant réel (montant - montant_paye) — colonnes SQL
        impayes_agg = arrears_qs.aggregate(
            total_montant=Sum('montant'),
            total_paye=Sum('montant_paye')
        )
        impayes_total = (impayes_agg['total_montant'] or 0) - (impayes_agg['total_paye'] or 0)

        locataires_impayes = arrears_qs.values('contrat__locataire').distinct().count()

        arrears_list = []
        for p in arrears_qs.order_by('-date_echeance')[:5]:
            montant_restant = float(p.montant or 0) - float(p.montant_paye or 0)
            locataire_nom = 'Inconnu'
            bien_titre = 'Inconnu'
            if p.contrat:
                if p.contrat.locataire and p.contrat.locataire.user:
                    locataire_nom = p.contrat.locataire.user.get_full_name()
                if p.contrat.bien:
                    bien_titre = p.contrat.bien.titre
            arrears_list.append({
                'id': p.id,
                'locataire_nom': locataire_nom,
                'bien_titre': bien_titre,
                'montant': montant_restant,
                'date_echeance': p.date_echeance.isoformat() if p.date_echeance else None
            })

        impayes_stats = {
            'totalAmount': float(impayes_total),
            'totalLocataires': locataires_impayes,
            'list': arrears_list
        }

        # 4. Upcoming Contracts (select_related pour éviter N+1)
        next_60_days = now.date() + timedelta(days=60)
        upcoming_qs = Contrat.objects.filter(
            statut=Contrat.StatutContrat.ACTIF,
            date_fin__gte=now.date(),
            date_fin__lte=next_60_days
        ).select_related('locataire__user', 'bien').order_by('date_fin')[:4]

        upcoming_contracts = []
        for c in upcoming_qs:
            locataire_nom = 'Locataire inconnu'
            bien_titre = 'Inconnu'
            if c.locataire and c.locataire.user:
                locataire_nom = c.locataire.user.get_full_name()
            if c.bien:
                bien_titre = c.bien.titre
            upcoming_contracts.append({
                'id': c.id,
                'locataire_nom': locataire_nom,
                'bien_titre': bien_titre,
                'date_fin': c.date_fin.isoformat() if c.date_fin else None
            })

        return Response({
            'biens': biens_stats,
            'revenus': revenus_stats,
            'impayes': impayes_stats,
            'upcomingContracts': upcoming_contracts
        })
