import calendar
from datetime import timedelta

from django.db.models import Count, F, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from bien.models import Bien
from contrats.models import Contrat
from notifications.models import Notification
from paiement.models import Paiement
from utilisateur.models import Locataire, Proprietaire, Utilisateur


class AdminDashboardView(APIView):
    """
    Tableau de bord de l'administrateur.
    Fournit les statistiques consolidees sur l'ensemble du parc immobilier :
    biens, contrats, flux de paiements, utilisateurs et evenements recents.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in [Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT]:
            return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)

        # 1. Statistiques des biens
        biens_qs = Bien.objects.all()
        biens_stats = biens_qs.aggregate(
            total=Count("id"),
            maisons=Count("id", filter=Q(type=Bien.TypeBien.MAISON)),
            appartements=Count("id", filter=Q(type=Bien.TypeBien.APPARTEMENT)),
            terrains=Count("id", filter=Q(type=Bien.TypeBien.TERRAIN)),
            locations=Count("id", filter=Q(mode_transaction=Bien.ModeTransaction.LOCATION)),
            ventes=Count("id", filter=Q(mode_transaction=Bien.ModeTransaction.VENTE)),
            dispo=Count("id", filter=Q(statut=Bien.StatutBien.DISPONIBLE)),
            loue=Count("id", filter=Q(statut=Bien.StatutBien.LOUE)),
            vendu=Count("id", filter=Q(statut=Bien.StatutBien.VENDU)),
            travaux=Count("id", filter=Q(statut=Bien.StatutBien.EN_TRAVAUX)),
        )

        # 2. Statistiques des contrats
        today = timezone.now().date()
        last_day = calendar.monthrange(today.year, today.month)[1]
        end_of_month = today.replace(day=last_day)
        contrats_qs = Contrat.objects.all()
        contrats_stats = contrats_qs.aggregate(
            total=Count("id"),
            actifs=Count("id", filter=Q(statut=Contrat.StatutContrat.ACTIF)),
            expiring=Count(
                "id",
                filter=Q(
                    statut=Contrat.StatutContrat.ACTIF,
                    date_fin__gte=today,
                    date_fin__lte=end_of_month,
                ),
            ),
            locations=Count("id", filter=Q(type_contrat=Contrat.TypeContrat.LOCATION)),
            ventes=Count("id", filter=Q(type_contrat=Contrat.TypeContrat.ACHAT)),
        )

        # 3. Statistiques des paiements
        paiements_qs = Paiement.objects.all()
        paiements_aggs = paiements_qs.aggregate(
            valides=Count("id", filter=Q(statut=Paiement.StatutPaiement.PAYE)),
            enAttente=Count("id", filter=Q(statut=Paiement.StatutPaiement.EN_ATTENTE)),
            enRetard=Count("id", filter=Q(statut=Paiement.StatutPaiement.EN_RETARD)),
            partiels=Count("id", filter=Q(statut=Paiement.StatutPaiement.PARTIEL)),
            totalRevenus=Sum("montant", filter=Q(statut=Paiement.StatutPaiement.PAYE)),
            totalAttendu=Sum("montant", filter=Q(statut=Paiement.StatutPaiement.EN_ATTENTE)),
        )

        # 4. Statistiques des utilisateurs
        utilisateurs_stats = Utilisateur.objects.aggregate(
            total=Count("id"),
            admins=Count("id", filter=Q(role=Utilisateur.Role.ADMIN)),
            agents=Count("id", filter=Q(role=Utilisateur.Role.AGENT)),
        )
        utilisateurs_stats["proprietaires"] = Proprietaire.objects.count()
        utilisateurs_stats["locataires"] = Locataire.objects.count()

        # 5. Evenements recents
        recent_events = []

        recent_contrats = Contrat.objects.select_related("bien").order_by("-date_creation")[:5]
        for c in recent_contrats:
            titre_bien = c.bien.titre if c.bien else f"Bien #{c.bien_id}"
            type_libelle = "location" if c.type_contrat == Contrat.TypeContrat.LOCATION else "vente"
            recent_events.append({
                "id": f"c-{c.id}",
                "type": "CONTRAT",
                "date": c.date_creation.isoformat() if c.date_creation else None,
                "title": "Nouveau contrat",
                "text": f"Contrat de {type_libelle} pour {titre_bien}.",
                "icon": "FileText",
                "color": "blue",
            })

        recent_paiements = Paiement.objects.filter(
            statut=Paiement.StatutPaiement.PAYE
        ).order_by("-date_paiement")[:5]
        for p in recent_paiements:
            montant = float(p.montant) if p.montant else 0.0
            recent_events.append({
                "id": f"p-{p.id}",
                "type": "PAIEMENT",
                "date": p.date_paiement.isoformat() if p.date_paiement else None,
                "title": "Paiement reçu",
                "text": f"Règlement de {montant:,.0f} Ar effectué.".replace(",", " "),
                "icon": "Wallet",
                "color": "green",
            })

        recent_biens = Bien.objects.order_by("-id")[:5]
        for b in recent_biens:
            recent_events.append({
                "id": f"b-{b.id}",
                "type": "BIEN",
                "date": timezone.now().isoformat(),
                "title": "Nouveau bien ajouté",
                "text": f"Le bien {b.titre} a été ajouté au catalogue.",
                "icon": "Home",
                "color": "orange",
            })

        # Tri et conservation des 5 plus recents
        recent_events = sorted(
            [e for e in recent_events if e["date"]],
            key=lambda x: x["date"],
            reverse=True,
        )[:5]

        return Response({
            "biens": biens_stats,
            "contrats": contrats_stats,
            "paiements": {
                "valides": paiements_aggs["valides"] or 0,
                "enAttente": paiements_aggs["enAttente"] or 0,
                "enRetard": paiements_aggs["enRetard"] or 0,
                "partiels": paiements_aggs["partiels"] or 0,
                "totalRevenus": float(paiements_aggs["totalRevenus"] or 0),
                "totalAttendu": float(paiements_aggs["totalAttendu"] or 0),
            },
            "utilisateurs": utilisateurs_stats,
            "recentEvents": recent_events,
        })


class AgentDashboardView(APIView):
    """
    Tableau de bord de l'agent immobilier.
    Synthese operationnelle des biens disponibles, des loyers percus,
    des impayes en cours et des contrats arrivant a echeance.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in [Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT]:
            return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)

        # 1. Statistiques des biens
        biens_stats = Bien.objects.aggregate(
            total=Count("id"),
            dispo=Count("id", filter=Q(statut=Bien.StatutBien.DISPONIBLE)),
            loue=Count("id", filter=Q(statut=Bien.StatutBien.LOUE)),
            travaux=Count("id", filter=Q(statut=Bien.StatutBien.EN_TRAVAUX)),
        )

        # 2. Statistiques des revenus
        now = timezone.now()
        current_month = now.month
        current_year = now.year
        last_month = 12 if current_month == 1 else current_month - 1
        year_of_last_month = current_year - 1 if current_month == 1 else current_year

        paiements_payes = Paiement.objects.filter(
            statut=Paiement.StatutPaiement.PAYE,
            date_paiement__isnull=False,
        )

        rev_current = paiements_payes.filter(
            date_paiement__month=current_month,
            date_paiement__year=current_year,
        ).aggregate(total=Sum("montant_paye"))["total"] or 0

        rev_last = paiements_payes.filter(
            date_paiement__month=last_month,
            date_paiement__year=year_of_last_month,
        ).aggregate(total=Sum("montant_paye"))["total"] or 0

        revenues_by_month = {}
        for p in paiements_payes.values("date_paiement", "montant_paye"):
            month_key = p["date_paiement"].strftime("%b %Y")
            revenues_by_month[month_key] = revenues_by_month.get(month_key, 0) + float(p["montant_paye"] or 0)

        chart_data = [{"name": k, "Revenus": v} for k, v in revenues_by_month.items()]

        revenus_stats = {
            "currentMonth": float(rev_current),
            "lastMonth": float(rev_last),
            "chartData": chart_data,
        }

        # 3. Impayes et retards de paiement
        limit = now.date() - timedelta(days=5)
        arrears_qs = Paiement.objects.exclude(
            statut__in=[Paiement.StatutPaiement.PAYE, Paiement.StatutPaiement.ANNULE],
        ).filter(
            date_echeance__lt=limit,
        ).select_related("contrat__locataire__user", "contrat__bien")

        impayes_agg = arrears_qs.aggregate(
            total_montant=Sum("montant"),
            total_paye=Sum("montant_paye"),
        )
        impayes_total = (impayes_agg["total_montant"] or 0) - (impayes_agg["total_paye"] or 0)
        locataires_impayes = arrears_qs.values("contrat__locataire").distinct().count()

        arrears_list = []
        for p in arrears_qs.order_by("-date_echeance")[:5]:
            montant_restant = float(p.montant or 0) - float(p.montant_paye or 0)
            locataire_nom = "Inconnu"
            bien_titre = "Inconnu"
            if p.contrat:
                if p.contrat.locataire and p.contrat.locataire.user:
                    locataire_nom = p.contrat.locataire.user.get_full_name()
                if p.contrat.bien:
                    bien_titre = p.contrat.bien.titre
            arrears_list.append({
                "id": p.id,
                "locataire_nom": locataire_nom,
                "bien_titre": bien_titre,
                "montant": montant_restant,
                "date_echeance": p.date_echeance.isoformat() if p.date_echeance else None,
            })

        impayes_stats = {
            "totalAmount": float(impayes_total),
            "totalLocataires": locataires_impayes,
            "list": arrears_list,
        }

        # 4. Prochains contrats arrivant a echeance sous 60 jours
        next_60_days = now.date() + timedelta(days=60)
        upcoming_qs = Contrat.objects.filter(
            statut=Contrat.StatutContrat.ACTIF,
            date_fin__gte=now.date(),
            date_fin__lte=next_60_days,
        ).select_related("locataire__user", "bien").order_by("date_fin")[:4]

        upcoming_contracts = []
        for c in upcoming_qs:
            locataire_nom = "Locataire inconnu"
            bien_titre = "Inconnu"
            if c.locataire and c.locataire.user:
                locataire_nom = c.locataire.user.get_full_name()
            if c.bien:
                bien_titre = c.bien.titre
            upcoming_contracts.append({
                "id": c.id,
                "locataire_nom": locataire_nom,
                "bien_titre": bien_titre,
                "date_fin": c.date_fin.isoformat() if c.date_fin else None,
            })

        return Response({
            "biens": biens_stats,
            "revenus": revenus_stats,
            "impayes": impayes_stats,
            "upcomingContracts": upcoming_contracts,
        })


class ProprietaireDashboardView(APIView):
    """
    Tableau de bord proprietaire - version de reference.
    Calcule les indicateurs cles du proprietaire connecte (biens, revenus, echeances).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != Utilisateur.Role.PROPRIETAIRE:
            return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)

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

        tous_paiements = list(
            Paiement.objects.filter(
                contrat__bien__proprietaire__user=user
            ).select_related("contrat__locataire__user", "contrat__bien")
        )
        now = timezone.now()
        current_month = now.month
        current_year = now.year
        last_month = 12 if current_month == 1 else current_month - 1
        last_month_year = current_year - 1 if current_month == 1 else current_year

        revenu_ce_mois = 0
        revenu_mois_dernier = 0

        chart_data = {
            i: {
                "month": (current_month - 1 - i) % 12 + 1,
                "year": current_year if (current_month - 1 - i) >= 0 else current_year - 1,
                "total": 0,
            }
            for i in range(5, -1, -1)
        }

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
                    "date_paiement": p.date_paiement.isoformat(),
                })

        recent_paiements = sorted(recent_paiements, key=lambda x: x["date_paiement"], reverse=True)[:5]

        echeances = [
            p for p in tous_paiements
            if p.statut in [Paiement.StatutPaiement.EN_ATTENTE, Paiement.StatutPaiement.EN_RETARD]
        ]
        echeances = [e for e in echeances if e.date_echeance and e.date_echeance >= now.date()]
        echeances = sorted(echeances, key=lambda x: x.date_echeance)

        prochaine_date = echeances[0].date_echeance if echeances else None
        loyers_attendus = sum(1 for e in echeances if e.date_echeance == prochaine_date) if prochaine_date else 0

        toutes_notifs = list(Notification.objects.filter(utilisateur=user))
        unread_notifs = sum(1 for n in toutes_notifs if not n.lu)

        return Response({
            "biens": {
                "total": total_biens,
                "loues": loues,
                "disponibles": dispos,
                "taux_occupation": taux_occupation,
            },
            "revenus": {
                "ce_mois": revenu_ce_mois,
                "mois_dernier": revenu_mois_dernier,
                "chart_data": list(chart_data.values()),
            },
            "prochaine_echeance": {
                "date": prochaine_date.isoformat() if prochaine_date else None,
                "nombre": loyers_attendus,
            },
            "recent_paiements": recent_paiements,
            "unread_notifications": unread_notifs,
        })


class ProprietaireDashboardOptimizedView(APIView):
    """
    Tableau de bord proprietaire optimise avec requetes d'agregation ORM.
    Fournit les memes metriques que la version de reference avec une performance accrue.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != Utilisateur.Role.PROPRIETAIRE:
            return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        current_month = now.month
        current_year = now.year
        last_month = 12 if current_month == 1 else current_month - 1
        last_month_year = current_year - 1 if current_month == 1 else current_year

        # 1. Biens
        biens_stats = Bien.objects.filter(proprietaire__user=user).aggregate(
            total=Count("id"),
            loues=Count("id", filter=Q(statut=Bien.StatutBien.LOUE)),
            disponibles=Count("id", filter=Q(statut=Bien.StatutBien.DISPONIBLE)),
        )
        total_biens = biens_stats["total"] or 0
        loues = biens_stats["loues"] or 0
        dispos = biens_stats["disponibles"] or 0
        taux_occupation = round((loues / total_biens) * 100) if total_biens > 0 else 0

        # 2. Revenus
        paiements_qs = Paiement.objects.filter(
            contrat__bien__proprietaire__user=user,
            statut=Paiement.StatutPaiement.PAYE,
            date_paiement__isnull=False,
        )

        six_months_ago = now.date().replace(day=1) - timedelta(days=5 * 30)

        revenus_par_mois = (
            paiements_qs.filter(date_paiement__gte=six_months_ago)
            .annotate(month=TruncMonth("date_paiement"))
            .values("month")
            .annotate(total=Sum("montant"))
            .order_by("month")
        )

        revenu_ce_mois = 0
        revenu_mois_dernier = 0
        chart_data_map = {}
        for row in revenus_par_mois:
            d = row["month"]
            amt = float(row["total"] or 0)
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

        # 3. Paiements recents
        recent_paiements_qs = (
            paiements_qs.select_related("contrat__locataire__user", "contrat__bien")
            .order_by("-date_paiement")[:5]
        )

        recent_paiements = [
            {
                "id": p.id,
                "locataire_nom": p.contrat.locataire.user.get_full_name() if p.contrat.locataire.user else "Inconnu",
                "bien_titre": p.contrat.bien.titre,
                "montant": float(p.montant or 0),
                "date_paiement": p.date_paiement.isoformat(),
                "statut": p.statut,
            }
            for p in recent_paiements_qs
        ]

        # 4. Prochaine echeance
        echeances_qs = (
            Paiement.objects.filter(
                contrat__bien__proprietaire__user=user,
                statut__in=[Paiement.StatutPaiement.EN_ATTENTE, Paiement.StatutPaiement.EN_RETARD],
                date_echeance__gte=now.date(),
            )
            .select_related("contrat__locataire__user", "contrat__bien")
            .order_by("date_echeance")
        )

        prochaine_echeance = echeances_qs.first()
        prochaine_date = prochaine_echeance.date_echeance if prochaine_echeance else None
        loyers_attendus = echeances_qs.filter(date_echeance=prochaine_date).count() if prochaine_date else 0

        recent_echeances = [
            {
                "id": e.id,
                "date_echeance": e.date_echeance.isoformat(),
                "locataire_nom": e.contrat.locataire.user.get_full_name() if (e.contrat and e.contrat.locataire and e.contrat.locataire.user) else "Inconnu",
                "bien_titre": e.contrat.bien.titre if (e.contrat and e.contrat.bien) else "Inconnu",
                "montant_attendu": float(e.montant_attendu or e.montant or 0),
            }
            for e in echeances_qs[:3]
        ]

        # 5. Notifications
        notifs_qs = Notification.objects.filter(utilisateur=user).order_by("-date_creation")
        unread_notifs = notifs_qs.filter(lu=False).count()
        recent_notifications = [
            {
                "id": n.id,
                "titre": n.titre,
                "message": n.message,
                "date_creation": n.date_creation.isoformat() if n.date_creation else None,
                "type_display": getattr(n, "type_display", n.titre),
            }
            for n in notifs_qs[:3]
        ]

        # 6. Biens recents
        biens_recents_qs = Bien.objects.filter(proprietaire__user=user).order_by("-id")[:3]
        recent_biens = [
            {
                "id": b.id,
                "titre": b.titre,
                "adresse": b.adresse,
                "statut": b.statut,
                "loyer_mensuel": float(b.loyer_mensuel or b.prix or 0),
            }
            for b in biens_recents_qs
        ]

        return Response({
            "biens": {
                "total": total_biens,
                "loues": loues,
                "disponibles": dispos,
                "taux_occupation": taux_occupation,
                "recent_biens": recent_biens,
            },
            "revenus": {
                "ce_mois": float(revenu_ce_mois),
                "mois_dernier": float(revenu_mois_dernier),
                "chart_data": chart_data,
            },
            "prochaine_echeance": {
                "date": prochaine_date.isoformat() if prochaine_date else None,
                "nombre": loyers_attendus,
            },
            "recent_echeances": recent_echeances,
            "recent_paiements": recent_paiements,
            "unread_notifications": unread_notifs,
            "recent_notifications": recent_notifications,
        })
