"""Vues du module Reservation."""

from __future__ import annotations

import logging

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from notifications.models import Notification
from utilisateur.models import Utilisateur

from .models import Reservation
from .permissions import ReservationPermission
from .serializers import (
    RepondreReservationSerializer,
    ReservationDetailSerializer,
    ReservationSerializer,
)

logger = logging.getLogger(__name__)


class ReservationViewSet(viewsets.ModelViewSet):
    """
    CRUD sur les réservations, avec action métier dédiée :

        POST /reservations/              Créer une réservation (LOCATAIRE)
        GET  /reservations/              Lister les réservations
        GET  /reservations/{id}/         Détail d'une réservation
        POST /reservations/{id}/repondre/ Répondre à une réservation (ADMIN/AGENT)
    """

    queryset = Reservation.objects.select_related(
        "bien", "bien__proprietaire__user",
        "locataire", "locataire__user",
        "contrat",
    ).defer("bien__photos")
    permission_classes = [permissions.IsAuthenticated, ReservationPermission]
    filterset_fields = ["statut", "type_reservation", "bien", "locataire"]
    ordering_fields = ["date_creation", "statut"]
    ordering = ["-date_creation"]

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return ReservationDetailSerializer
        return ReservationSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return queryset

        if user.role == Utilisateur.Role.LOCATAIRE:
            return queryset.filter(locataire__user=user)

        return queryset.none()

    def perform_create(self, serializer):
        """Associe automatiquement le locataire connecté à la réservation."""
        locataire = self.request.user.profil_locataire
        serializer.save(locataire=locataire)

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Re-serialize with detail serializer for richer response
        detail = ReservationDetailSerializer(serializer.instance)
        return Response(
            {
                "success": True,
                "message": "Réservation créée avec succès.",
                "data": detail.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def list(self, request: Request, *args, **kwargs) -> Response:
        queryset = self.filter_queryset(self.get_queryset())
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

    @action(detail=True, methods=["post"])
    def repondre(self, request: Request, pk=None) -> Response:
        """
        POST /reservations/{id}/repondre/
        Permet à l'admin ou l'agent de répondre à une réservation.
        Body : { "reponse_admin": "...", "statut": "TRAITEE" | "ANNULEE" }
        """
        reservation = self.get_object()

        if reservation.statut != Reservation.StatutReservation.EN_ATTENTE:
            return Response(
                {"error": "Cette réservation a déjà été traitée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RepondreReservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reservation.reponse_admin = serializer.validated_data["reponse_admin"]
        reservation.statut = serializer.validated_data.get(
            "statut", Reservation.StatutReservation.TRAITEE
        )
        reservation.save(update_fields=["reponse_admin", "statut"])

        # Notifier le locataire
        Notification.objects.create(
            utilisateur=reservation.locataire.user,
            type=Notification.Type.NOUVELLE_RESERVATION,
            message=serializer.validated_data["reponse_admin"],
        )

        logger.info(
            "Réservation #%s traitée par %s (statut: %s)",
            reservation.pk,
            request.user.email,
            reservation.statut,
        )

        detail = ReservationDetailSerializer(reservation)
        return Response({
            "success": True,
            "message": "Réponse envoyée au locataire.",
            "data": detail.data,
        })
