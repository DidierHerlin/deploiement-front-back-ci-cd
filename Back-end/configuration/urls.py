from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from reporting_views import ReportingStatsView
from admin_dashboard_views import AdminDashboardView
from agent_dashboard_views import AgentDashboardView
from proprietaire_dashboard_views import ProprietaireDashboardView, ProprietaireDashboardOptimizedView

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from django.views.decorators.http import require_GET

@require_GET
def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("health/", health_check, name="health"),
    path("api/health/", health_check, name="api-health"),
    path("api/health", health_check),
    path("admin/", admin.site.urls),
    path("api/", include("utilisateur.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("bien.urls")),
    path("api/", include("contrats.urls")),
    path('api/', include('paiement.urls')),
    path('api/', include('reservation.urls')),
    path('api/reporting/stats/', ReportingStatsView.as_view(), name='reporting-stats'),
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/agent/dashboard/', AgentDashboardView.as_view(), name='agent-dashboard'),
    path('api/dashboard/proprietaire/', ProprietaireDashboardView.as_view(), name='proprietaire-dashboard'),
    path('api/dashboard/proprietaire-optimized/', ProprietaireDashboardOptimizedView.as_view(), name='proprietaire-dashboard-optimized'),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # En production (gunicorn/K8s), Django doit aussi servir /media/
    # (l'Ingress route déjà /media vers le backend).
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)