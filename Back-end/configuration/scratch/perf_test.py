import os
import sys
import django
import time
from django.db import connection, reset_queries

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.conf import settings
if "testserver" not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append("testserver")

from django.test import Client
from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from reservation.models import Reservation
from datetime import date
from django.utils import timezone
from dateutil.relativedelta import relativedelta

def setup_data():
    print("Nettoyage de la base de données...")
    Paiement.objects.all().delete()
    Contrat.objects.all().delete()
    Reservation.objects.all().delete()
    Bien.objects.all().delete()
    Locataire.objects.all().delete()
    Proprietaire.objects.all().delete()
    Utilisateur.objects.exclude(is_superuser=True).delete()

    print("Création des données de test (50 entités)...")
    admin = Utilisateur.objects.filter(is_superuser=True).first()
    if not admin:
        admin = Utilisateur.objects.create_superuser("admin_perf@t.com", "pwd", role=Utilisateur.Role.ADMIN)

    # Création en masse
    locataires = []
    proprietaires = []
    biens = []
    
    for i in range(20):
        u_prop = Utilisateur.objects.create_user(f"prop{i}@t.com", "pwd", role=Utilisateur.Role.PROPRIETAIRE)
        prop = Proprietaire.objects.create(user=u_prop, iban=f"FR{i}")
        proprietaires.append(prop)

        u_loc = Utilisateur.objects.create_user(f"loc{i}@t.com", "pwd", role=Utilisateur.Role.LOCATAIRE)
        loc = Locataire.objects.create(user=u_loc)
        locataires.append(loc)

        bien = Bien.objects.create(
            proprietaire=prop, titre=f"Bien {i}", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=50,
            nombre_pieces=2, loyer_mensuel=1000, statut=Bien.StatutBien.DISPONIBLE
        )
        biens.append(bien)

    for i in range(20):
        c = Contrat.objects.create(
            bien=biens[i], locataire=locataires[i], type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=timezone.now().date(), date_fin=timezone.now().date() + relativedelta(months=12), loyer=1000, depot_garantie=1000
        )
        # Paiements are auto-generated via signal

    return admin

def measure_endpoint(client, url, name):
    reset_queries()
    start_time = time.time()
    response = client.get(url)
    end_time = time.time()
    
    queries = len(connection.queries)
    duration = (end_time - start_time) * 1000  # en millisecondes
    
    print(f"[{name}] {url}")
    print(f"   Status : {response.status_code}")
    print(f"   Temps  : {duration:.2f} ms")
    print(f"   SQL DB Queries : {queries}")
    return duration, queries

def run_tests():
    admin = setup_data()
    client = Client()
    client.force_login(admin)

    print("\n--- DEBUT DES TESTS DE PERFORMANCE ---")
    endpoints = [
        ("/api/biens/", "Liste Biens"),
        ("/api/contrats/", "Liste Contrats"),
        ("/api/paiements/", "Liste Paiements"),
        ("/api/locataires/", "Liste Locataires"),
        ("/api/proprietaires/", "Liste Proprietaires"),
    ]
    
    total_time = 0
    total_queries = 0
    
    for url, name in endpoints:
        dur, q = measure_endpoint(client, url, name)
        total_time += dur
        total_queries += q

    print("\n--- RESUME ---")
    print(f"Temps Total : {total_time:.2f} ms")
    print(f"Requêtes DB Totales : {total_queries}")
    
if __name__ == "__main__":
    run_tests()
