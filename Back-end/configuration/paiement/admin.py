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


from .models import DemandePaiement


@admin.register(DemandePaiement)
class DemandePaiementAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "locataire",
        "facture",
        "montant",
        "moyen_paiement",
        "statut",
        "telephone",
        "reference",
        "date_demande",
        "date_traitement",
    )
    list_filter = ("statut", "moyen_paiement", "date_demande")
    search_fields = (
        "locataire__user__nom",
        "locataire__user__prenoms",
        "locataire__user__email",
        "reference",
        "telephone",
    )
    readonly_fields = ("date_demande",)
    raw_id_fields = ("locataire", "facture")
    actions = ["valider_demandes", "refuser_demandes"]

    @admin.action(description="Valider les demandes sélectionnées (Passer en PAYÉ et générer la quittance)")
    def valider_demandes(self, request, queryset):
        from django.db import transaction
        count = 0
        for demande in queryset.filter(statut=DemandePaiement.StatutDemande.EN_ATTENTE):
            with transaction.atomic():
                demande.valider()
                facture = demande.facture
                facture.mode_paiement = demande.moyen_paiement
                if demande.reference:
                    facture.reference = demande.reference
                facture.save()
                facture.valider_paiement()
                count += 1
        self.message_user(request, f"{count} demande(s) de paiement validée(s) avec succès.")

    @admin.action(description="Refuser les demandes sélectionnées")
    def refuser_demandes(self, request, queryset):
        count = 0
        for demande in queryset.filter(statut=DemandePaiement.StatutDemande.EN_ATTENTE):
            demande.refuser(motif="Refusé depuis l'administration")
            count += 1
        self.message_user(request, f"{count} demande(s) de paiement refusée(s).")