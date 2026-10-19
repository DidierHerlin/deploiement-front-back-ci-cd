from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.http import FileResponse, Http404
from .models import Paiement, DemandePaiement
from .serializers import (
    PaiementSerializer,
    DemandePaiementSerializer,
    DemandePaiementCreateSerializer,
)
from .permissions import PaiementPermission, DemandePaiementPermission
from utilisateur.models import Utilisateur
from contrats.models import Contrat
from .utils import generate_quittance_pdf   # <-- IMPORTANT


class PaiementPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related(
        "contrat__bien__proprietaire__user",
        "contrat__locataire__user"
    ).defer("contrat__bien__photos")
    serializer_class = PaiementSerializer
    pagination_class = PaiementPagination
    permission_classes = [permissions.IsAuthenticated, PaiementPermission]
    filterset_fields = ["statut", "contrat", "mode_paiement", "est_partiel"]
    ordering_fields = ["date_creation", "date_echeance", "date_paiement", "montant"]
    ordering = ["-date_creation"]

    def perform_create(self, serializer):
        paiement = serializer.save()
        # Notification logic
        from notifications.services import NotificationService
        from notifications.models import Notification
        
        utilisateurs_a_notifier = []
        if paiement.contrat and paiement.contrat.locataire and paiement.contrat.locataire.user:
            utilisateurs_a_notifier.append(paiement.contrat.locataire.user)
            
        for u in utilisateurs_a_notifier:
            NotificationService.envoyer(
                utilisateur=u,
                type_notif=Notification.Type.AUTRE,
                titre=f"Nouveau paiement ajouté pour {paiement.contrat.bien.titre}",
                message=f"Un nouveau paiement de {int(float(paiement.montant_attendu or 0)):,} Ar a été généré.".replace(",", " "),
                lien=f"/paiements/{paiement.id}",
                contexte_email={"paiement": paiement}
            )

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return queryset

        if user.role == Utilisateur.Role.LOCATAIRE:
            return queryset.filter(contrat__locataire__user=user)

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            return queryset.filter(contrat__bien__proprietaire__user=user)

        return Paiement.objects.none()

    @action(detail=True, methods=["post"])
    def valider(self, request, pk=None):
        paiement = self.get_object()
        if paiement.statut == Paiement.StatutPaiement.PAYE:
            return Response({"error": "Ce paiement est déjà validé."},
                            status=status.HTTP_400_BAD_REQUEST)
        
        mode = request.data.get("mode_paiement")
        reference = request.data.get("reference")
        
        if mode:
            paiement.mode_paiement = mode
        if reference is not None:
            paiement.reference = reference

        with transaction.atomic():
            paiement.save()
            paiement.valider_paiement()
            for demande in paiement.demandes_paiement.filter(statut=DemandePaiement.StatutDemande.EN_ATTENTE):
                demande.valider()
            
        # Notification logic
        from notifications.services import NotificationService
        from notifications.models import Notification
        
        utilisateurs_a_notifier = []
        if paiement.contrat and paiement.contrat.locataire and paiement.contrat.locataire.user:
            utilisateurs_a_notifier.append(paiement.contrat.locataire.user)
        if paiement.contrat and paiement.contrat.bien and paiement.contrat.bien.proprietaire and paiement.contrat.bien.proprietaire.user:
            utilisateurs_a_notifier.append(paiement.contrat.bien.proprietaire.user)
            
        for u in utilisateurs_a_notifier:
            NotificationService.envoyer(
                utilisateur=u,
                type_notif=Notification.Type.PAIEMENT_VALIDE,
                titre=f"Paiement validé pour le contrat {paiement.contrat.bien.titre}",
                message=f"Le paiement de {int(float(paiement.montant or 0)):,} Ar pour {paiement.contrat.bien.titre} a été validé.".replace(",", " "),
                lien=f"/api/paiements/{paiement.id}/quittance/",
                contexte_email={"paiement": paiement}
            )

        return Response(PaiementSerializer(paiement).data)

    @action(detail=True, methods=["post"])
    def refuser(self, request, pk=None):
        paiement = self.get_object()
        if paiement.statut == Paiement.StatutPaiement.PAYE:
            return Response({"error": "Un paiement validé ne peut pas être refusé."},
                            status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            paiement.statut = Paiement.StatutPaiement.ANNULE
            paiement.save(update_fields=["statut"])
            motif = request.data.get("motif_refus", request.data.get("motif", ""))
            for demande in paiement.demandes_paiement.filter(statut=DemandePaiement.StatutDemande.EN_ATTENTE):
                demande.refuser(motif=motif)
        
        return Response(PaiementSerializer(paiement).data)

    @action(detail=True, methods=["post"])
    def annuler(self, request, pk=None):
        paiement = self.get_object()
        if paiement.statut == Paiement.StatutPaiement.PAYE:
            return Response({"error": "Un paiement validé ne peut pas être annulé."},
                            status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            paiement.annuler_paiement()
            for demande in paiement.demandes_paiement.filter(statut=DemandePaiement.StatutDemande.EN_ATTENTE):
                demande.annuler()
        return Response(PaiementSerializer(paiement).data)

    @action(detail=True, methods=["get"])
    def quittance(self, request, pk=None):
        paiement = self.get_object()

        if paiement.statut != Paiement.StatutPaiement.PAYE:
            return Response(
                {"error": "Seuls les paiements validés peuvent générer une quittance."},
                status=status.HTTP_400_BAD_REQUEST
            )

        needs_generation = (
            not paiement.fichier_quittance
            or not paiement.fichier_quittance.name
            or not paiement.fichier_quittance.storage.exists(
                paiement.fichier_quittance.name
            )
        )
        if needs_generation:
            try:
                generate_quittance_pdf(paiement)
                paiement.refresh_from_db()
            except Exception as e:
                return Response(
                    {"error": f"Erreur lors de la génération du PDF : {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        if (
            paiement.fichier_quittance
            and paiement.fichier_quittance.name
            and paiement.fichier_quittance.storage.exists(
                paiement.fichier_quittance.name
            )
        ):
            from django.http import HttpResponse

            with paiement.fichier_quittance.open("rb") as f:
                pdf_bytes = f.read()

            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = (
                f'inline; filename="quittance_{paiement.pk}.pdf"'
            )
            origin = request.META.get("HTTP_ORIGIN", "")
            if origin:
                response["Access-Control-Allow-Origin"] = origin
                response["Access-Control-Allow-Credentials"] = "true"
            return response
        else:
            return Response(
                {"error": "Impossible de lire le fichier de quittance sur le serveur après génération."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["get"])
    def impayes(self, request):
        user = request.user
        if user.role not in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT, Utilisateur.Role.PROPRIETAIRE):
            return Response({"error": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            statut__in=[Paiement.StatutPaiement.EN_ATTENTE, Paiement.StatutPaiement.EN_RETARD],
            date_echeance__lt=today - timezone.timedelta(days=5)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "count": queryset.count(),
            "results": serializer.data
        })


class DemandePaiementPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class DemandePaiementViewSet(viewsets.ModelViewSet):
    """
    CRUD et actions pour les demandes de paiement soumises par les locataires.
    Accès sécurisé :
    - Locataire : consultation et création de ses propres demandes, annulation
    - Agent / Admin : consultation globale, validation, refus
    - Propriétaire : consultation des demandes associées à ses biens
    """
    queryset = DemandePaiement.objects.select_related(
        "locataire__user",
        "facture__contrat__bien",
        "facture__contrat__locataire__user"
    )
    permission_classes = [permissions.IsAuthenticated, DemandePaiementPermission]
    pagination_class = DemandePaiementPagination
    filterset_fields = ["statut", "moyen_paiement", "facture"]
    ordering_fields = ["date_demande", "montant"]
    ordering = ["-date_demande"]

    def get_serializer_class(self):
        if self.action == "create":
            return DemandePaiementCreateSerializer
        return DemandePaiementSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return queryset

        if user.role == Utilisateur.Role.LOCATAIRE:
            return queryset.filter(locataire__user=user)

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            return queryset.filter(facture__contrat__bien__proprietaire__user=user)

        return DemandePaiement.objects.none()

    def perform_create(self, serializer):
        demande = serializer.save()

        # Notification logic
        from notifications.services import NotificationService
        from notifications.models import Notification

        try:
            if demande.locataire and demande.locataire.user:
                NotificationService.envoyer(
                    utilisateur=demande.locataire.user,
                    type_notif=Notification.Type.AUTRE,
                    titre="Demande de paiement Mobile Money enregistrée",
                    message=(
                        f"Votre demande de paiement de {int(float(demande.montant)):,} Ar "
                        f"via {demande.get_moyen_paiement_display()} pour {demande.facture.contrat.bien.titre} "
                        "a bien été enregistrée et est en attente de validation."
                    ).replace(",", " "),
                    lien="/locataire/paiements",
                    contexte_email={"demande": demande}
                )
        except Exception:
            pass

    @action(detail=True, methods=["post"])
    def annuler(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != DemandePaiement.StatutDemande.EN_ATTENTE:
            return Response(
                {"error": "Seule une demande en attente peut être annulée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        demande.annuler()
        return Response(DemandePaiementSerializer(demande).data)

    @action(detail=True, methods=["post"])
    def valider(self, request, pk=None):
        user = request.user
        if user.role not in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return Response(
                {"error": "Permission refusée."},
                status=status.HTTP_403_FORBIDDEN,
            )
        demande = self.get_object()
        if demande.statut != DemandePaiement.StatutDemande.EN_ATTENTE:
            return Response(
                {"error": "Cette demande n'est pas en attente."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            demande.valider()
            facture = demande.facture
            facture.mode_paiement = demande.moyen_paiement
            if demande.reference:
                facture.reference = demande.reference
            facture.save()
            facture.valider_paiement()
        return Response(DemandePaiementSerializer(demande).data)

    @action(detail=True, methods=["post"])
    def refuser(self, request, pk=None):
        user = request.user
        if user.role not in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return Response(
                {"error": "Permission refusée."},
                status=status.HTTP_403_FORBIDDEN,
            )
        demande = self.get_object()
        if demande.statut != DemandePaiement.StatutDemande.EN_ATTENTE:
            return Response(
                {"error": "Cette demande n'est pas en attente."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        motif = request.data.get("motif_refus", request.data.get("motif", ""))
        demande.refuser(motif=motif)
        return Response(DemandePaiementSerializer(demande).data)

    @action(detail=False, methods=["get"], url_path="factures-eligibles")
    def factures_eligibles(self, request):
        user = request.user
        if user.role != Utilisateur.Role.LOCATAIRE:
            return Response(
                {"error": "Seul un locataire peut consulter ses factures éligibles."},
                status=status.HTTP_403_FORBIDDEN,
            )
        from contrats.models import Contrat

        contrats = Contrat.objects.filter(
            locataire__user=user,
            statut=Contrat.StatutContrat.ACTIF
        )

        factures_avec_demande = DemandePaiement.objects.filter(
            locataire__user=user,
            statut=DemandePaiement.StatutDemande.EN_ATTENTE,
        ).values_list("facture_id", flat=True)

        eligibles_ids = []
        for contrat in contrats:
            prochaine = Paiement.objects.filter(
                contrat=contrat
            ).exclude(
                statut__in=[Paiement.StatutPaiement.PAYE, Paiement.StatutPaiement.ANNULE]
            ).exclude(
                id__in=factures_avec_demande
            ).order_by("date_echeance").first()
            if prochaine:
                eligibles_ids.append(prochaine.id)

        factures_eligibles = Paiement.objects.filter(id__in=eligibles_ids).select_related("contrat__bien").order_by("date_echeance")
        serializer = PaiementSerializer(factures_eligibles, many=True)
        return Response({
            "count": factures_eligibles.count(),
            "results": serializer.data,
        })

