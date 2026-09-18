from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import Paiement


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "contrat",
        "date_echeance",
        "date_paiement",
        "montant",
        "mode_paiement",
        "statut",
        "est_partiel",
        "est_en_retard",
        "lien_quittance",   # ← nouveau
    )
    list_filter = ("statut", "mode_paiement", "est_partiel", "date_echeance")
    search_fields = ("contrat__bien__titre", "contrat__locataire__user__nom", "reference")
    readonly_fields = ("date_creation", "date_paiement", "fichier_quittance")  # ← en lecture seule
    raw_id_fields = ("contrat",)
    date_hierarchy = "date_echeance"
    ordering = ("-date_creation",)

    fieldsets = (
        (None, {"fields": ("contrat", "statut")}),
        ("Dates", {"fields": ("date_echeance", "date_paiement")}),
        ("Montants", {"fields": ("montant", "est_partiel")}),
        ("Paiement", {"fields": ("mode_paiement", "reference")}),
        ("Quittance", {"fields": ("fichier_quittance",)}),  # ← nouveau bloc
        ("Métadonnées", {"fields": ("date_creation",)}),
    )

    @admin.display(boolean=True, description="En retard")
    def est_en_retard(self, obj):
        return obj.est_en_retard

    @admin.display(description="Quittance")
    def lien_quittance(self, obj):
        """
        Affiche un lien cliquable vers le fichier PDF si la quittance existe.
        """
        if obj.fichier_quittance:
            url = obj.fichier_quittance.url
            return format_html('<a href="{}" target="_blank">📄 Télécharger</a>', url)
        return "-"