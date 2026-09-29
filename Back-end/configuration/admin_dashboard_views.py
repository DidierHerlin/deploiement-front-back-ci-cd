from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
import calendar

from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from utilisateur.models import Utilisateur, Proprietaire, Locataire

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in [Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT]:
            return Response({"detail": "Non autoris."}, status=403)

        # 1. Biens Stats
        biens_qs = Bien.objects.all()
        biens_stats = biens_qs.aggregate(
            total=Count('id'),
            maisons=Count('id', filter=Q(type=Bien.TypeBien.MAISON)),
            appartements=Count('id', filter=Q(type=Bien.TypeBien.APPARTEMENT)),
            terrains=Count('id', filter=Q(type=Bien.TypeBien.TERRAIN)),
            locations=Count('id', filter=Q(mode_transaction=Bien.ModeTransaction.LOCATION)),
            ventes=Count('id', filter=Q(mode_transaction=Bien.ModeTransaction.VENTE)),
            dispo=Count('id', filter=Q(statut=Bien.StatutBien.DISPONIBLE)),
            loue=Count('id', filter=Q(statut=Bien.StatutBien.LOUE)),
            vendu=Count('id', filter=Q(statut=Bien.StatutBien.VENDU)),
            travaux=Count('id', filter=Q(statut=Bien.StatutBien.EN_TRAVAUX))
        )

        # 2. Contrats Stats
        today = timezone.now().date()
        last_day = calendar.monthrange(today.year, today.month)[1]
        end_of_month = today.replace(day=last_day)
        contrats_qs = Contrat.objects.all()
        contrats_stats = contrats_qs.aggregate(
            total=Count('id'),
            actifs=Count('id', filter=Q(statut=Contrat.StatutContrat.ACTIF)),
            expiring=Count('id', filter=Q(statut=Contrat.StatutContrat.ACTIF, date_fin__gte=today, date_fin__lte=end_of_month)),
            locations=Count('id', filter=Q(type_contrat=Contrat.TypeContrat.LOCATION)),
            ventes=Count('id', filter=Q(type_contrat=Contrat.TypeContrat.ACHAT))
        )

        # 3. Paiements Stats
        paiements_qs = Paiement.objects.all()
        paiements_aggs = paiements_qs.aggregate(
            valides=Count('id', filter=Q(statut=Paiement.StatutPaiement.PAYE) | Q(statut='VALIDE')),
            enAttente=Count('id', filter=Q(statut=Paiement.StatutPaiement.EN_ATTENTE)),
            enRetard=Count('id', filter=Q(est_en_retard=True)),
            partiels=Count('id', filter=Q(est_partiel=True)),
            totalRevenus=Sum('montant_paye', filter=Q(statut=Paiement.StatutPaiement.PAYE) | Q(statut='VALIDE')),
            totalAttendu=Sum('montant', filter=Q(statut=Paiement.StatutPaiement.EN_ATTENTE))
        )

        # 4. Utilisateurs Stats
        utilisateurs_stats = Utilisateur.objects.aggregate(
            total=Count('id'),
            admins=Count('id', filter=Q(role=Utilisateur.Role.ADMIN)),
            agents=Count('id', filter=Q(role=Utilisateur.Role.AGENT))
        )
        utilisateurs_stats['proprietaires'] = Proprietaire.objects.count()
        utilisateurs_stats['locataires'] = Locataire.objects.count()

        # 5. Recent Events
        recent_events = []
        recent_contrats = Contrat.objects.order_by('-date_creation')[:5]
        for c in recent_contrats:
            titre_bien = c.bien.titre if c.bien else f"Bien #{c.bien_id}"
            recent_events.append({
                'id': f'c-{c.id}',
                'type': 'CONTRAT',
                'date': c.date_creation.isoformat() if c.date_creation else None,
                'title': 'Nouveau contrat',
                'text': f"Contrat de {'location' if c.type_contrat == 'LOCATION' else 'vente'} pour {titre_bien}.",
                'icon': 'FileText',
                'color': 'blue'
            })
            
        recent_paiements = Paiement.objects.filter(statut__in=[Paiement.StatutPaiement.PAYE, 'VALIDE']).order_by('-date_paiement')[:5]
        for p in recent_paiements:
            montant = float(p.montant_paye) if p.montant_paye else 0.0
            recent_events.append({
                'id': f'p-{p.id}',
                'type': 'PAIEMENT',
                'date': p.date_paiement.isoformat() if p.date_paiement else None,
                'title': 'Paiement reu',
                'text': f"Rglement de {montant:,.0f} Ar effectu.".replace(',', ' '),
                'icon': 'Wallet',
                'color': 'green'
            })
            
        # Sort and take top 5
        recent_events = sorted(
            [e for e in recent_events if e['date']], 
            key=lambda x: x['date'], 
            reverse=True
        )[:5]

        return Response({
            'biens': biens_stats,
            'contrats': contrats_stats,
            'paiements': {
                'valides': paiements_aggs['valides'] or 0,
                'enAttente': paiements_aggs['enAttente'] or 0,
                'enRetard': paiements_aggs['enRetard'] or 0,
                'partiels': paiements_aggs['partiels'] or 0,
                'totalRevenus': float(paiements_aggs['totalRevenus'] or 0),
                'totalAttendu': float(paiements_aggs['totalAttendu'] or 0)
            },
            'utilisateurs': utilisateurs_stats,
            'recentEvents': recent_events
        })
