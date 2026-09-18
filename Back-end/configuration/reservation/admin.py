from django.contrib import admin

from .models import Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("id", "locataire", "bien", "type_reservation", "statut", "date_creation")
    list_filter = ("statut", "type_reservation")
    search_fields = ("locataire__user__nom", "locataire__user__prenoms", "bien__titre")
    readonly_fields = ("date_creation",)
