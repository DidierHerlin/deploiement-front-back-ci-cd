from django.contrib import admin
from .models import TypeBien


@admin.register(TypeBien)
class TypeBienAdmin(admin.ModelAdmin):
    list_display = ("id", "designation")
    search_fields = ("designation",)
