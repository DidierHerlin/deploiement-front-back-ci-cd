from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone

from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from utilisateur.models import Utilisateur, Proprietaire, Locataire

class ReportingStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Filtres de base selon le rle
        biens_qs = Bien.objects.all()
        contrats_qs = Contrat.objects.all()
        paiements_qs = Paiement.objects.all()
        
        if user.role == Utilisateur.Role.PROPRIETAIRE:
            biens_qs = biens_qs.filter(proprietaire__user=user)
            contrats_qs = contrats_qs.filter(bien__proprietaire__user=user)
            paiements_qs = paiements_qs.filter(contrat__bien__proprietaire__user=user)
        elif user.role == Utilisateur.Role.LOCATAIRE:
            biens_qs = biens_qs.filter(statut=Bien.StatutBien.DISPONIBLE) # Only see available
            contrats_qs = contrats_qs.filter(locataire__user=user)
            paiements_qs = paiements_qs.filter(contrat__locataire__user=user)

        # 1. Biens
        biens_stats = biens_qs.aggregate(
            total=Count('id'),
            disponibles=Count('id', filter=Q(statut=Bien.StatutBien.DISPONIBLE)),
            loues=Count('id', filter=Q(statut=Bien.StatutBien.LOUE)),
            vendus=Count('id', filter=Q(statut=Bien.StatutBien.VENDU)),
            en_travaux=Count('id', filter=Q(statut=Bien.StatutBien.EN_TRAVAUX)),
            reserves=Count('id', filter=Q(statut=Bien.StatutBien.RESERVE)),
        )

        # 2. Contrats
        contrats_stats = contrats_qs.aggregate(
            total=Count('id'),
            actifs=Count('id', filter=Q(statut=Contrat.StatutContrat.ACTIF)),
            resilies=Count('id', filter=Q(statut=Contrat.StatutContrat.RESILIE)),
        )

        # 3. Paiements
        today = timezone.now().date()
        impayes_filter = Q(statut__in=[Paiement.StatutPaiement.EN_ATTENTE, Paiement.StatutPaiement.EN_RETARD]) & Q(date_echeance__lt=today - timezone.timedelta(days=5))
        
        paiements_stats = paiements_qs.aggregate(
            total=Count('id'),
            payes=Count('id', filter=Q(statut=Paiement.StatutPaiement.PAYE)),
            en_attente=Count('id', filter=Q(statut=Paiement.StatutPaiement.EN_ATTENTE)),
            en_retard=Count('id', filter=Q(statut=Paiement.StatutPaiement.EN_RETARD)),
            impayes_count=Count('id', filter=impayes_filter),
            revenus_total=Sum('montant_paye', filter=Q(statut=Paiement.StatutPaiement.PAYE))
        )

        # 4. Utilisateurs (pour Admin/Agent)
        users_stats = {}
        if user.role in [Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT]:
            users_stats = {
                'total_users': Utilisateur.objects.count(),
                'total_proprietaires': Proprietaire.objects.count(),
                'total_locataires': Locataire.objects.count(),
            }

        return Response({
            'biens': biens_stats,
            'contrats': contrats_stats,
            'paiements': paiements_stats,
            'users': users_stats
        })
