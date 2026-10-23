from rest_framework.routers import DefaultRouter
from .views import TypeBienViewSet

router = DefaultRouter()
router.register(r"types-biens", TypeBienViewSet, basename="typebien")

urlpatterns = router.urls
