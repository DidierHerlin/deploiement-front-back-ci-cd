from rest_framework.routers import DefaultRouter
from .views import PaiementViewSet, DemandePaiementViewSet

router = DefaultRouter()
router.register(r"paiements", PaiementViewSet, basename="paiement")
router.register(r"demandes-paiement", DemandePaiementViewSet, basename="demande-paiement")

urlpatterns = router.urls