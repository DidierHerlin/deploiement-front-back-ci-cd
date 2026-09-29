from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
import calendar
from datetime import timedelta
from dateutil.relativedelta import relativedelta

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

        # 1. Biens Stats
        biens_qs = Bien.objects.all()
        biens_stats = biens_qs.aggregate(
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

        paiements_qs = Paiement.objects.filter(statut=Paiement.StatutPaiement.PAYE, date_paiement__isnull=False)
        
        rev_current = paiements_qs.filter(
            date_paiement__month=current_month, 
            date_paiement__year=current_year
        ).aggregate(total=Sum('loyer_contrat'))['total'] or 0

        rev_last = paiements_qs.filter(
            date_paiement__month=last_month, 
            date_paiement__year=year_of_last_month
        ).aggregate(total=Sum('loyer_contrat'))['total'] or 0

        # Chart Data
        revenues_by_month = {}
        # Fetch all paid payments to group by month
        for p in paiements_qs:
            month_key = p.date_paiement.strftime('%b %Y') # Not strictly French but enough to send back
            revenues_by_month[month_key] = revenues_by_month.get(month_key, 0) + float(p.montant or 0)
            
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
        ).filter(date_echeance__lt=limit).order_by('-date_echeance')
        
        impayes_total = arrears_qs.aggregate(
            total=Sum('montant_restant')
        )['total'] or arrears_qs.aggregate(total=Sum('montant'))['total'] or 0
        
        locataires_impayes = arrears_qs.values('contrat__locataire').distinct().count()

        arrears_list = []
        for p in arrears_qs[:5]:
            arrears_list.append({
                'id': p.id,
                'locataire_nom': p.contrat.locataire.user.get_full_name() if p.contrat and p.contrat.locataire else 'Inconnu',
                'bien_titre': p.contrat.bien.titre if p.contrat and p.contrat.bien else 'Inconnu',
                'montant': float(p.montant_restant or p.montant or 0),
                'date_echeance': p.date_echeance.isoformat() if p.date_echeance else None
            })

        impayes_stats = {
            'totalAmount': float(impayes_total),
            'totalLocataires': locataires_impayes,
            'list': arrears_list
        }

        # 4. Upcoming Contracts
        next_60_days = now.date() + timedelta(days=60)
        upcoming_qs = Contrat.objects.filter(
            statut=Contrat.StatutContrat.ACTIF,
            date_fin__gte=now.date(),
            date_fin__lte=next_60_days
        ).order_by('date_fin')[:4]
        
        upcoming_contracts = []
        for c in upcoming_qs:
            upcoming_contracts.append({
                'id': c.id,
                'locataire_nom': c.locataire.user.get_full_name() if c.locataire else 'Locataire inconnu',
                'bien_titre': c.bien.titre if c.bien else 'Inconnu',
                'date_fin': c.date_fin.isoformat() if c.date_fin else None
            })

        return Response({
            'biens': biens_stats,
            'revenus': revenus_stats,
            'impayes': impayes_stats,
            'upcomingContracts': upcoming_contracts
        })
