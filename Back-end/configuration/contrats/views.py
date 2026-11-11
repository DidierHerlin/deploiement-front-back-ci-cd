"""Vues du module Contrat."""

from __future__ import annotations

from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from bien.models import Bien
from utilisateur.models import Utilisateur

from common.mixins import RoleScopedQuerySetMixin
from common.utils import defer_bien_photos
from .models import Contrat
from .permissions import ContratPermission
from .serializers import ContratSerializer, EcheanceSerializer


from django.http import HttpResponse
from .utils import generate_contrat_pdf

class ContratViewSet(RoleScopedQuerySetMixin, viewsets.ModelViewSet):
    owner_field = "bien__proprietaire__user"
    tenant_field = "locataire__user"

    @action(detail=True, methods=["get"])
    def telecharger(self, request: Request, pk: int | None = None) -> HttpResponse | Response:

        contrat = self.get_object()  # Vérifie automatiquement que le contrat est accessible

        if contrat.type_contrat != Contrat.TypeContrat.LOCATION:
            return Response({"error": "Seuls les contrats de location ont un bail."}, status=status.HTTP_400_BAD_REQUEST)

        pdf_bytes = generate_contrat_pdf(contrat)
        if not pdf_bytes:
            return Response({"error": "Erreur lors de la génération du document."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        nom_locataire = contrat.locataire.user.nom or contrat.locataire.user.prenoms or "Locataire"
        nom_bien = contrat.bien.titre.replace(" ", "_")
        response['Content-Disposition'] = f'inline; filename="Contrat_Bail_{nom_locataire}_{nom_bien}.pdf"'
        return response

    queryset = defer_bien_photos(Contrat.objects.select_related("bien", "locataire", "locataire__user"), "bien")
    serializer_class = ContratSerializer
    permission_classes = [permissions.IsAuthenticated, ContratPermission]
    filterset_fields = ["statut", "type_contrat", "bien", "locataire"]
    ordering_fields = ["date_creation", "date_debut", "date_fin", "loyer", "prix"]
    ordering = ["-date_creation"]

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            from .serializers import ContratListSerializer
            return ContratListSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        contrat = serializer.save()
        from notifications.services import NotificationService
        NotificationService.notifier_contrat_cree(contrat)

    def get_queryset(self):
        return self.filter_by_user_role(super().get_queryset())

    @action(detail=False, methods=["get"], url_path="bien-info")
    def bien_info(self, request: Request) -> Response:
        bien_id = request.query_params.get("bien_id")
        if not bien_id:
            return Response({"error": "bien_id est requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bien = defer_bien_photos(Bien.objects.all()).get(id=bien_id, statut=Bien.StatutBien.DISPONIBLE)
        except (Bien.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "Bien non trouvé ou indisponible."}, status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "loyer_mensuel": bien.loyer_mensuel,
            "prix": bien.prix,
            "mode_transaction": bien.mode_transaction,
            "type": bien.type,
            "surface": bien.surface,
            "adresse": bien.adresse,
            "titre": bien.titre,
        })

    @action(detail=True, methods=["post"])
    def resilier(self, request: Request, pk: int | None = None) -> Response:
        return self._executer_transition(
            type_contrat_attendu=Contrat.TypeContrat.LOCATION,
            erreur_type_incorrect="Seuls les contrats de location peuvent être résiliés.",
            erreur_statut_incorrect="Seul un contrat actif peut être résilié.",
            nom_methode="resilier",
        )

    @action(detail=True, methods=["post"])
    def terminer(self, request: Request, pk: int | None = None) -> Response:
        return self._executer_transition(
            type_contrat_attendu=Contrat.TypeContrat.LOCATION,
            erreur_type_incorrect="Seuls les contrats de location peuvent être terminés.",
            erreur_statut_incorrect="Seul un contrat actif peut être terminé.",
            nom_methode="terminer",
        )

    @action(detail=True, methods=["post"])
    def finaliser_vente(self, request: Request, pk: int | None = None) -> Response:
        return self._executer_transition(
            type_contrat_attendu=Contrat.TypeContrat.ACHAT,
            erreur_type_incorrect="Seuls les contrats d'achat peuvent être finalisés.",
            erreur_statut_incorrect="Seul un contrat actif peut être finalisé.",
            nom_methode="finaliser_vente",
        )

    def _executer_transition(
        self,
        *,
        type_contrat_attendu: str,
        erreur_type_incorrect: str,
        erreur_statut_incorrect: str,
        nom_methode: str,
    ) -> Response:
        contrat = self.get_object()

        if contrat.type_contrat != type_contrat_attendu:
            return Response({"error": erreur_type_incorrect}, status=status.HTTP_400_BAD_REQUEST)

        if contrat.statut != Contrat.StatutContrat.ACTIF:
            return Response({"error": erreur_statut_incorrect}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            getattr(contrat, nom_methode)()

        return Response(ContratSerializer(contrat).data)

    @action(detail=False, methods=["get"], url_path="echeances")
    def echeances_a_venir(self, request):

        user = request.user

        # RcupǸrer les contrats avec select_related pour Ǹviter les N+1 sur les relations
        if user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            contrats = Contrat.objects.filter(
                type_contrat=Contrat.TypeContrat.LOCATION,
                statut=Contrat.StatutContrat.ACTIF
            ).select_related("bien", "locataire__user").defer("bien__photos")
        elif user.role == Utilisateur.Role.LOCATAIRE:
            contrats = Contrat.objects.filter(
                type_contrat=Contrat.TypeContrat.LOCATION,
                statut=Contrat.StatutContrat.ACTIF,
                locataire__user=user
            ).select_related("bien", "locataire__user").defer("bien__photos")
        elif user.role == Utilisateur.Role.PROPRIETAIRE:
            contrats = Contrat.objects.filter(
                type_contrat=Contrat.TypeContrat.LOCATION,
                statut=Contrat.StatutContrat.ACTIF,
                bien__proprietaire__user=user
            ).select_related("bien", "locataire__user").defer("bien__photos")
        else:
            return Response({"error": "Permission refusǸe."}, status=status.HTTP_403_FORBIDDEN)

        # Batch fetch all paid payments for these contracts
        from paiement.models import Paiement
        paiements_payes = Paiement.objects.filter(
            contrat__in=contrats,
            statut=Paiement.StatutPaiement.PAYE
        ).values_list('contrat_id', 'date_echeance')
        
        payes_par_contrat = {}
        for c_id, date in paiements_payes:
            payes_par_contrat.setdefault(c_id, set()).add(date)

        toutes_echeances = []
        for contrat in contrats:
            payes = payes_par_contrat.get(contrat.id, set())
            echeances = contrat.get_echeances_a_venir(paiements_payes=payes)
            toutes_echeances.extend(echeances)

        toutes_echeances.sort(key=lambda x: x['date_echeance'])

        serializer = EcheanceSerializer(toutes_echeances, many=True)
        return Response({
            "count": len(toutes_echeances),
            "results": serializer.data
        })