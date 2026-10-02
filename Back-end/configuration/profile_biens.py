import os
import sys
import time
import django
from django.test import RequestFactory

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from utilisateur.models import Utilisateur
from bien.views import BienViewSet
from bien.models import Bien
from django.db import connection, reset_queries

def run_profile():
    # Créer quelques biens s'il n'y en a pas
    if Bien.objects.count() == 0:
        print("Aucun bien, création...")
        # Create user
        user, _ = Utilisateur.objects.get_or_create(email="admin@test.com", defaults={"role": "ADMIN"})
        if not hasattr(user, 'profil_proprietaire'):
            from utilisateur.models import Proprietaire
            Proprietaire.objects.create(user=user)
        prop = user.profil_proprietaire
        for i in range(100):
            Bien.objects.create(
                proprietaire=prop,
                titre=f"Bien {i}",
                type="APPARTEMENT",
                mode_transaction="LOCATION",
                adresse="1 rue test",
                surface=50.0,
                nombre_pieces=2,
                loyer_mensuel=500.0,
                statut="DISPONIBLE",
                photos=["http://example.com/photo1.jpg", "http://example.com/photo2.jpg"]
            )
        print("100 biens créés.")

    user = Utilisateur.objects.filter(role="ADMIN").first()
    if not user:
        user = Utilisateur.objects.first()

    factory = RequestFactory()
    request = factory.get('/api/biens/')
    request.user = user

    view = BienViewSet.as_view({'get': 'list'})
    
    reset_queries()
    start_time = time.time()
    response = view(request)
    response.render() # force rendering to evaluate generators
    end_time = time.time()
    
    queries = connection.queries
    print(f"Time taken: {end_time - start_time:.4f} seconds")
    print(f"Number of SQL queries: {len(queries)}")
    print(f"Total Bien count: {Bien.objects.count()}")
    print(f"Response status: {response.status_code}")
    print(f"Data length: {len(response.content)}")
    
    # Print a few slow queries
    queries_by_time = sorted(queries, key=lambda q: float(q['time']), reverse=True)
    for q in queries_by_time[:3]:
        print(f"Slow query ({q['time']}s): {q['sql'][:100]}...")

if __name__ == "__main__":
    run_profile()
