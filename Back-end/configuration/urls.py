from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.decorators.http import require_GET
from django.views.static import serve
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


@require_GET
def health_check(request):
    """Sonde de sante pour l'infrastructure (Docker, Kubernetes, load balancers)."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    # Verifications de sante
    path("health/", health_check, name="health"),
    path("api/health/", health_check, name="api-health"),
    path("api/health", health_check),

    # Administration Django
    path("admin/", admin.site.urls),

    # Routes des applications metier
    path("api/", include("utilisateur.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("bien.urls")),
    path("api/", include("contrats.urls")),
    path("api/", include("paiement.urls")),
    path("api/", include("reservation.urls")),
    path("api/", include("TypeBien.urls")),
    path("api/", include("Transaction.urls")),
    path("api/", include("Status.urls")),

    # Documentation API OpenAPI / Swagger
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
