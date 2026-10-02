from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from bien.models import Bien
from paiement.models import Paiement
from notifications.models import Notification
from utilisateur.models import Utilisateur

class ProprietaireDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != Utilisateur.Role.PROPRIETAIRE:
            return Response({"detail": "Non autoris."}, status=403)

        # ---------------------------------------------------------
        # OLD SLOW WAY (Mimicking frontend loops and multiple queries)
        # ---------------------------------------------------------
        
        # 1. Fetch ALL biens and loop (N+1 simulated or memory heavy)
        tous_biens = list(Bien.objects.filter(proprietaire__user=user))
        total_biens = len(tous_biens)
        loues = 0
        dispos = 0
        for b in tous_biens:
            if b.statut == Bien.StatutBien.LOUE:
                loues += 1
            elif b.statut == Bien.StatutBien.DISPONIBLE:
                dispos += 1
                
        taux_occupation = round((loues / total_biens) * 100) if total_biens > 0 else 0

        # 2. Fetch ALL paiements and loop (heavy loop)
        tous_paiements = list(Paiement.objects.filter(contrat__bien__proprietaire__user=user).select_related('contrat__locataire__user', 'contrat__bien'))
        now = timezone.now()
        current_month = now.month
        current_year = now.year
        last_month = 12 if current_month == 1 else current_month - 1
        last_month_year = current_year - 1 if current_month == 1 else current_year
        
        revenu_ce_mois = 0
        revenu_mois_dernier = 0
        
        chart_data = {i: {"month": (current_month - 1 - i) % 12 + 1, "year": current_year if (current_month - 1 - i) >= 0 else current_year - 1, "total": 0} for i in range(5, -1, -1)}
        
        recent_paiements = []

        for p in tous_paiements:
            if p.statut == Paiement.StatutPaiement.PAYE and p.date_paiement:
                amt = float(p.montant_paye or p.montant or p.montant_attendu or 0)
                d = p.date_paiement
                if d.month == current_month and d.year == current_year:
                    revenu_ce_mois += amt
                elif d.month == last_month and d.year == last_month_year:
                    revenu_mois_dernier += amt
                    
                for key, data in chart_data.items():
                    if data["month"] == d.month and data["year"] == d.year:
                        data["total"] += amt
                        
                recent_paiements.append({
                    "id": p.id,
                    "locataire_nom": p.contrat.locataire.user.get_full_name() if (p.contrat and p.contrat.locataire and p.contrat.locataire.user) else "Inconnu",
                    "bien_titre": p.contrat.bien.titre if p.contrat and p.contrat.bien else "Inconnu",
                    "montant": amt,
                    "date_paiement": p.date_paiement.isoformat()
                })
        
        recent_paiements = sorted(recent_paiements, key=lambda x: x["date_paiement"], reverse=True)[:5]
        
        # 3. Echeances (Paiements en attente /  venir)
        echeances = [p for p in tous_paiements if p.statut in [Paiement.StatutPaiement.EN_ATTENTE, Paiement.StatutPaiement.EN_RETARD]]
        echeances = [e for e in echeances if e.date_echeance and e.date_echeance >= now.date()]
        echeances = sorted(echeances, key=lambda x: x.date_echeance)
        
        prochaine_date = echeances[0].date_echeance if echeances else None
        loyers_attendus = sum(1 for e in echeances if e.date_echeance == prochaine_date) if prochaine_date else 0

        # 4. Notifications
        toutes_notifs = list(Notification.objects.filter(utilisateur=user))
        unread_notifs = sum(1 for n in toutes_notifs if not n.lu)

        return Response({
            "biens": {
                "total": total_biens,
                "loues": loues,
                "disponibles": dispos,
                "taux_occupation": taux_occupation
            },
            "revenus": {
                "ce_mois": revenu_ce_mois,
                "mois_dernier": revenu_mois_dernier,
                "chart_data": list(chart_data.values())
            },
            "prochaine_echeance": {
                "date": prochaine_date.isoformat() if prochaine_date else None,
                "nombre": loyers_attendus
            },
            "recent_paiements": recent_paiements,
            "unread_notifications": unread_notifs
        })

class ProprietaireDashboardOptimizedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != Utilisateur.Role.PROPRIETAIRE:
            return Response({"detail": "Non autoris."}, status=403)

        now = timezone.now()
        current_month = now.month
        current_year = now.year
        last_month = 12 if current_month == 1 else current_month - 1
        last_month_year = current_year - 1 if current_month == 1 else current_year

        # 1. Biens (1 seule requete DB via aggregation)
        biens_stats = Bien.objects.filter(proprietaire__user=user).aggregate(
            total=Count('id'),
            loues=Count('id', filter=Q(statut=Bien.StatutBien.LOUE)),
            disponibles=Count('id', filter=Q(statut=Bien.StatutBien.DISPONIBLE))
        )
        total_biens = biens_stats['total'] or 0
        loues = biens_stats['loues'] or 0
        dispos = biens_stats['disponibles'] or 0
        taux_occupation = round((loues / total_biens) * 100) if total_biens > 0 else 0

        # 2. Revenus (1 seule requete group_by)
        paiements_qs = Paiement.objects.filter(
            contrat__bien__proprietaire__user=user,
            statut=Paiement.StatutPaiement.PAYE,
            date_paiement__isnull=False
        )

        from django.db.models.functions import TruncMonth
        six_months_ago = now.date().replace(day=1) - timedelta(days=5*30) 
        
        revenus_par_mois = paiements_qs.filter(date_paiement__gte=six_months_ago).annotate(
            month=TruncMonth('date_paiement')
        ).values('month').annotate(total=Sum('montant')).order_by('month')

        revenu_ce_mois = 0
        revenu_mois_dernier = 0
        chart_data_map = {}
        for row in revenus_par_mois:
            d = row['month']
            amt = float(row['total'] or 0)
            if d.month == current_month and d.year == current_year:
                revenu_ce_mois = amt
            elif d.month == last_month and d.year == last_month_year:
                revenu_mois_dernier = amt
            chart_data_map[f"{d.year}-{d.month}"] = amt

        chart_data = []
        for i in range(5, -1, -1):
            target_month = (current_month - 1 - i) % 12 + 1
            target_year = current_year if (current_month - 1 - i) >= 0 else current_year - 1
            amt = chart_data_map.get(f"{target_year}-{target_month}", 0.0)
            chart_data.append({"month": target_month, "year": target_year, "total": amt})
                    
        # 3. Recent paiements (with select_related to avoid N+1)
        recent_paiements_qs = paiements_qs.select_related(
            'contrat__locataire__user', 'contrat__bien'
        ).order_by('-date_paiement')[:5]
        
        recent_paiements = [{
            "id": p.id,
            "locataire_nom": p.contrat.locataire.user.get_full_name() if p.contrat.locataire.user else "Inconnu",
            "bien_titre": p.contrat.bien.titre,
            "montant": float(p.montant or 0),
            "date_paiement": p.date_paiement.isoformat(),
            "statut": p.statut
        } for p in recent_paiements_qs]

        # 4. Prochaine échéance
        echeances_qs = Paiement.objects.filter(
            contrat__bien__proprietaire__user=user,
            statut__in=[Paiement.StatutPaiement.EN_ATTENTE, Paiement.StatutPaiement.EN_RETARD],
            date_echeance__gte=now.date()
        ).select_related('contrat__locataire__user', 'contrat__bien').order_by('date_echeance')
        
        prochaine_echeance = echeances_qs.first()
        prochaine_date = prochaine_echeance.date_echeance if prochaine_echeance else None
        loyers_attendus = echeances_qs.filter(date_echeance=prochaine_date).count() if prochaine_date else 0
        
        recent_echeances = [{
            "id": e.id,
            "date_echeance": e.date_echeance.isoformat(),
            "locataire_nom": e.contrat.locataire.user.get_full_name() if (e.contrat and e.contrat.locataire and e.contrat.locataire.user) else "Inconnu",
            "bien_titre": e.contrat.bien.titre if (e.contrat and e.contrat.bien) else "Inconnu",
            "montant_attendu": float(e.montant_attendu or e.montant or 0)
        } for e in echeances_qs[:3]]

        # 5. Notifications
        notifs_qs = Notification.objects.filter(utilisateur=user).order_by('-date_creation')
        unread_notifs = notifs_qs.filter(lu=False).count()
        recent_notifications = [{
            "id": n.id,
            "titre": n.titre,
            "message": n.message,
            "date_creation": n.date_creation.isoformat() if n.date_creation else None,
            "type_display": getattr(n, 'type_display', n.titre)
        } for n in notifs_qs[:3]]

        # 6. Biens récents
        biens_recents_qs = Bien.objects.filter(proprietaire__user=user).order_by('-id')[:3]
        recent_biens = [{
            "id": b.id,
            "titre": b.titre,
            "adresse": b.adresse,
            "statut": b.statut,
            "loyer_mensuel": float(b.loyer_mensuel or b.prix or 0)
        } for b in biens_recents_qs]

        return Response({
            "biens": {
                "total": total_biens,
                "loues": loues,
                "disponibles": dispos,
                "taux_occupation": taux_occupation,
                "recent_biens": recent_biens
            },
            "revenus": {
                "ce_mois": float(revenu_ce_mois),
                "mois_dernier": float(revenu_mois_dernier),
                "chart_data": chart_data
            },
            "prochaine_echeance": {
                "date": prochaine_date.isoformat() if prochaine_date else None,
                "nombre": loyers_attendus
            },
            "recent_echeances": recent_echeances,
            "recent_paiements": recent_paiements,
            "unread_notifications": unread_notifs,
            "recent_notifications": recent_notifications
        })
