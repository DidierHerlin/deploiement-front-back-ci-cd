from django.contrib import admin
from .models import Contrat


@admin.register(Contrat)
class ContratAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "bien",
        "locataire",
        "date_paiement",
        "type_contrat",
        "date_debut",
        "date_fin",
        "loyer",
        "prix",
        "depot_garantie",
        "statut",
        "date_creation",
    )
    list_filter = ("statut", "type_contrat", "date_debut", "date_fin")
    search_fields = ("bien__adresse", "bien__titre", "locataire__user__nom", "locataire__user__prenoms")
    readonly_fields = ("date_creation", "date_paiement")
    raw_id_fields = ("bien", "locataire")
    date_hierarchy = "date_creation"
    ordering = ("-date_creation",)

    fieldsets = (
        (None, {
            "fields": ("bien", "locataire", "type_contrat", "statut")
        }),
        ("Période", {
            "fields": ("date_debut", "date_fin", "date_paiement")
        }),
        ("Montants", {
            "fields": ("loyer", "depot_garantie", "prix")
        }),
        ("Documents", {
            "fields": ("document_pdf",)
        }),
        ("Métadonnées", {
            "fields": ("date_creation",)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ("bien", "locataire", "type_contrat")
        return self.readonly_fields

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == "type_contrat":
            kwargs["help_text"] = "Choisissez LOCATION pour une location, ACHAT pour une vente."
        elif db_field.name == "loyer":
            kwargs["help_text"] = "Obligatoire pour une location, ignoré pour un achat."
        elif db_field.name == "depot_garantie":
            kwargs["help_text"] = "Obligatoire pour une location, ignoré pour un achat."
        elif db_field.name == "prix":
            kwargs["help_text"] = "Obligatoire pour un achat, ignoré pour une location."
        elif db_field.name == "statut":
            kwargs["help_text"] = (
                "Pour une location : ACTIF, RESILIE, TERMINE. "
                "Pour un achat : ACTIF, VENDU."
            )
        elif db_field.name == "date_paiement":
            kwargs["help_text"] = "Calculé automatiquement : date_debut + 1 mois. Non modifiable."
        return super().formfield_for_dbfield(db_field, request, **kwargs)