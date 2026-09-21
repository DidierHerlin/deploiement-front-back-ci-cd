from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.http import FileResponse, Http404
from .models import Paiement
from .serializers import PaiementSerializer
from .permissions import PaiementPermission
from utilisateur.models import Utilisateur
from .utils import generate_quittance_pdf   # <-- IMPORTANT


class PaiementPagination(PageNumberPagination):
    """Pagination personnalisÃ©e pour les paiements.

    Permet au frontend de demander une taille de page via le paramÃ¨tre
    ``page_size`` (ex: ``?page_size=1000``).  La valeur maximale autorisÃ©e
    est plafonnÃ©e Ã  1 000 pour Ã©viter les abus.
    """
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 1000


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related(
        "contrat__bien__proprietaire__user",
        "contrat__locataire__user"
    )
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
                titre=f"Nouveau paiement ajoutÃ© pour {paiement.contrat.bien.titre}",
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
            return Response({"error": "Ce paiement est dÃ©jÃ  validÃ©."},
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
                titre=f"Paiement validÃ© pour le contrat {paiement.contrat.bien.titre}",
                message=f"Le paiement de {int(float(paiement.montant or 0)):,} Ar pour {paiement.contrat.bien.titre} a été validé.".replace(",", " "),
                lien=f"/api/paiements/{paiement.id}/quittance/",
                contexte_email={"paiement": paiement}
            )

        return Response(PaiementSerializer(paiement).data)

    @action(detail=True, methods=["post"])
    def refuser(self, request, pk=None):
        paiement = self.get_object()
        if paiement.statut == Paiement.StatutPaiement.PAYE:
            return Response({"error": "Un paiement validÃ© ne peut pas Ãªtre refusÃ©."},
                            status=status.HTTP_400_BAD_REQUEST)
        
        paiement.statut = Paiement.StatutPaiement.ECHOUE
        paiement.save(update_fields=["statut"])
        
        return Response(PaiementSerializer(paiement).data)

    @action(detail=True, methods=["post"])
    def annuler(self, request, pk=None):
        paiement = self.get_object()
        if paiement.statut == Paiement.StatutPaiement.PAYE:
            return Response({"error": "Un paiement validÃ© ne peut pas Ãªtre annulÃ©."},
                            status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            paiement.annuler_paiement()
        return Response(PaiementSerializer(paiement).data)

    @action(detail=True, methods=["get"])
    def quittance(self, request, pk=None):
        """
        RG-16 : GÃ©nÃ©rer ou servir la quittance de loyer au format PDF.
        """
        paiement = self.get_object()

        # 1. VÃ©rifier que le paiement est validÃ©
        if paiement.statut != Paiement.StatutPaiement.PAYE:
            return Response(
                {"error": "Seuls les paiements validÃ©s peuvent gÃ©nÃ©rer une quittance."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Si le fichier n'existe pas encore ou n'est plus sur le disque, le gÃ©nÃ©rer
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
                # RafraÃ®chir l'objet pour rÃ©cupÃ©rer le chemin du fichier sauvegardÃ©
                paiement.refresh_from_db()
            except Exception as e:
                return Response(
                    {"error": f"Erreur lors de la gÃ©nÃ©ration du PDF : {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # 3. VÃ©rifier que le fichier a bien Ã©tÃ© crÃ©Ã© et le servir
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
            # Headers CORS explicites pour les rÃ©ponses binaires
            origin = request.META.get("HTTP_ORIGIN", "")
            if origin:
                response["Access-Control-Allow-Origin"] = origin
                response["Access-Control-Allow-Credentials"] = "true"
            return response
        else:
            return Response(
                {"error": "Impossible de lire le fichier de quittance sur le serveur aprÃ¨s gÃ©nÃ©ration."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["get"])
    def impayes(self, request):
        user = request.user
        if user.role not in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT, Utilisateur.Role.PROPRIETAIRE):
            return Response({"error": "Permission refusÃ©e."}, status=status.HTTP_403_FORBIDDEN)

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
