from __future__ import annotations
from typing import Any
from django import forms
from django.contrib import admin
from django.db import models
from django.http import HttpRequest
from .models import Bien
@admin.register(Bien)
class BienAdmin(admin.ModelAdmin):

    # Textes d'aide affichés sous chaque champ du formulaire d'admin.
    HELP_TEXTS = {
        "mode_transaction": "Choisissez LOCATION pour un bien à louer, VENTE pour un bien à vendre.",
        "loyer_mensuel": "Obligatoire pour une location, ignoré pour une vente.",
        "prix": "Obligatoire pour une vente, ignoré pour une location.",
        "nombre_pieces": "Obligatoire pour Appartement/Maison/Local commercial, non applicable pour un Terrain.",
        "statut": (
            "DISPONIBLE : bien libre. "
            "LOUE : attribué automatiquement par un contrat de location actif. "
            "VENDU : attribué automatiquement par un contrat de vente finalisé. "
            "EN_TRAVAUX : utilisation manuelle."
        ),
    }

    list_display = (
        "id",
        "titre",
        "type",
        "mode_transaction",
        "statut",
        "loyer_mensuel",
        "prix",
        "surface",
        "nombre_pieces",
        "proprietaire",
    )
    list_filter = ("type", "mode_transaction", "statut")
    search_fields = ("titre", "adresse", "proprietaire__user__email", "proprietaire__user__nom")
    ordering = ("-id",)
    readonly_fields = ("id",)
    autocomplete_fields = ("proprietaire",)

    fieldsets = (
        (None, {
            "fields": ("proprietaire", "titre", "type", "mode_transaction", "statut")
        }),
        ("Localisation et surface", {
            "fields": ("adresse", "surface", "nombre_pieces")
        }),
        ("Tarifs", {
            "fields": ("loyer_mensuel", "prix")
        }),
        ("Photos", {
            "fields": ("photos",)
        }),
        ("Métadonnées", {
            "fields": ("id",)
        }),
    )

    def formfield_for_dbfield(self, db_field: models.Field, request: HttpRequest, **kwargs: Any) -> forms.Field:
        if db_field.name in self.HELP_TEXTS:
            kwargs["help_text"] = self.HELP_TEXTS[db_field.name]
        return super().formfield_for_dbfield(db_field, request, **kwargs)