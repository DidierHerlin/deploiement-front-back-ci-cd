import os
import time
import django
from django.test import Client

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from utilisateur.models import Utilisateur
from bien.models import Bien
from django.db import connection

def run_performance_tests():
    # Setup
    client = Client()
    
    # Check if we have an admin
    admin = Utilisateur.objects.filter(role=Utilisateur.Role.ADMIN).first()
    if not admin:
        print("No admin user found.")
        return

    client.force_login(admin)

    # 1. Test Bien API
    start_time = time.time()
    response = client.get('/api/biens/', HTTP_HOST='localhost')
    end_time = time.time()
    
    # Since we can't easily assertNumQueries outside of TransactionTestCase, we can just look at connection.queries
    
    print(f"GET /api/biens/ took {end_time - start_time:.4f} seconds")
    print(f"Status code: {response.status_code}")

    # 2. Test Contrats API
    start_time = time.time()
    response = client.get('/api/contrats/', HTTP_HOST='localhost')
    end_time = time.time()
    
    print(f"GET /api/contrats/ took {end_time - start_time:.4f} seconds")
    print(f"Status code: {response.status_code}")

    # 3. Test Paiements API
    start_time = time.time()
    response = client.get('/api/paiements/', HTTP_HOST='localhost')
    end_time = time.time()
    
    print(f"GET /api/paiements/ took {end_time - start_time:.4f} seconds")
    print(f"Status code: {response.status_code}")


if __name__ == "__main__":
    run_performance_tests()
