from __future__ import annotations

import logging

from django.db import transaction
from django.db.models import Q, QuerySet
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from utilisateur.models import Utilisateur, Proprietaire
from .models import Bien
from .permissions import PeutGererBien
from .serializers import BienListSerializer, BienSerializer

logger = logging.getLogger(__name__)


class BienViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, PeutGererBien]
    serializer_class = BienSerializer
    queryset = Bien.objects.select_related("proprietaire__user")

    def get_serializer_class(self) -> type[BienSerializer | BienListSerializer]:
        return BienListSerializer if self.action in ("list", "disponibles") else BienSerializer

    def get_serializer_context(self) -> dict:
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


    def get_queryset(self) -> QuerySet[Bien]:
        user = self.request.user
        queryset = super().get_queryset()

        # ADMIN / AGENT : accès total, aucun filtrage de visibilité.
        if user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return self._appliquer_filtres_recherche(queryset)
        if user.role == Utilisateur.Role.PROPRIETAIRE:
            try:
                proprietaire = user.profil_proprietaire
            except (AttributeError, Proprietaire.DoesNotExist):
                return Bien.objects.none()
            if self.action == "retrieve":
                queryset = queryset.filter(
                    Q(proprietaire=proprietaire) | Q(statut=Bien.StatutBien.DISPONIBLE)
                )
            else:
                queryset = queryset.filter(proprietaire=proprietaire)
            return self._appliquer_filtres_recherche(queryset)

        # LOCATAIRE : uniquement les biens disponibles, en lecture seule.
        if user.role == Utilisateur.Role.LOCATAIRE:
            queryset = queryset.filter(statut=Bien.StatutBien.DISPONIBLE)
            return self._appliquer_filtres_recherche(queryset)

        # Tout autre rôle éventuel (futur) : aucun accès par défaut.
        return Bien.objects.none()

    def _appliquer_filtres_recherche(self, queryset: QuerySet[Bien]) -> QuerySet[Bien]:
        params = self.request.query_params
        statut = params.get("statut")
        if statut:
            queryset = queryset.filter(statut=statut)
        type_bien = params.get("type")
        if type_bien:
            queryset = queryset.filter(type=type_bien)
        mode_transaction = params.get("mode_transaction")
        if mode_transaction:
            queryset = queryset.filter(mode_transaction=mode_transaction)
        return queryset

    # Bien CRUD

    def list(self, request: Request, *args, **kwargs) -> Response:
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return Response({
                "success": True,
                "count": self.paginator.page.paginator.count,
                "next": self.paginator.get_next_link(),
                "previous": self.paginator.get_previous_link(),
                "results": serializer.data,
            })

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "success": True,
            "count": queryset.count(),
            "results": serializer.data,
        })

    def disponibles(self, request: Request, *args, **kwargs) -> Response:
        queryset = self._appliquer_filtres_recherche(
            self.queryset.filter(statut=Bien.StatutBien.DISPONIBLE)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "success": True,
            "count": queryset.count(),
            "results": serializer.data,
        })

    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({"success": True, "data": serializer.data})

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            bien = serializer.save()

        logger.info("Bien créé : %s (id=%s) par %s", bien.titre, bien.id, request.user.email)

        return Response(
            {
                "success": True,
                "message": "Bien créé avec succès.",
                "data": BienSerializer(bien, context=self.get_serializer_context()).data,
            },
            status=status.HTTP_201_CREATED,
        )

    def update(self, request: Request, *args, **kwargs) -> Response:
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            bien = serializer.save()

        logger.info("Bien mis à jour : %s (id=%s) par %s", bien.titre, bien.id, request.user.email)

        return Response({
            "success": True,
            "message": "Bien mis à jour avec succès.",
            "data": serializer.data,
        })

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        bien = self.get_object()

        # Vérification supplémentaire : on ne supprime pas un bien loué ou vendu
        if bien.statut in (Bien.StatutBien.LOUE, Bien.StatutBien.VENDU):
            return self._reponse_conflit(
                f"Ce bien a le statut '{bien.get_statut_display()}' et ne peut pas être supprimé."
            )

        if self._a_un_contrat_actif(bien):
            return self._reponse_conflit(
                "Ce bien ne peut pas être supprimé : un contrat actif y est rattaché."
            )

        titre = bien.titre
        self.perform_destroy(bien)
        logger.info("Bien supprimé : %s par %s", titre, request.user.email)

        return Response(
            {"success": True, "message": "Bien supprimé avec succès."},
            status=status.HTTP_204_NO_CONTENT,
        )

    @staticmethod
    def _reponse_conflit(message: str) -> Response:
        return Response({"success": False, "error": message}, status=status.HTTP_409_CONFLICT)

    @staticmethod
    def _a_un_contrat_actif(bien: Bien) -> bool:
        try:
            from contrats.models import Contrat
        except (ImportError, ModuleNotFoundError):
            return False
        return Contrat.objects.filter(bien=bien, statut="ACTIF").exists()