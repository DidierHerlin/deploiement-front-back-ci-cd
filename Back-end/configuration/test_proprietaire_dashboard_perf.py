import os
import django
import time
import json
import uuid
import sys
from decimal import Decimal

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
django.setup()

from django.test import RequestFactory, TestCase
from django.db import connection, reset_queries
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import force_authenticate

from utilisateur.models import Utilisateur, Proprietaire, Locataire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from notifications.models import Notification
from proprietaire_dashboard_views import ProprietaireDashboardView, ProprietaireDashboardOptimizedView

class PerfTest(TestCase):
    def setUp(self):
        # Create a Proprietaire
        self.user = Utilisateur.objects.create_user(
            email="proprio_perf@test.com", 
            password="test", 
            role=Utilisateur.Role.PROPRIETAIRE
        )
        self.proprietaire = Proprietaire.objects.create(user=self.user)
        
        # Create Locataire
        self.loc_user = Utilisateur.objects.create_user(
            email="loc_perf@test.com", password="test", role=Utilisateur.Role.LOCATAIRE
        )
        self.locataire = Locataire.objects.create(user=self.loc_user)
        
        # Create Data
        now = timezone.now()
        for i in range(50):
            b = Bien.objects.create(
                proprietaire=self.proprietaire,
                titre=f"Bien {i}",
                type=Bien.TypeBien.APPARTEMENT,
                adresse="123 Rue de la Paix",
                surface=50,
                nombre_pieces=2,
                loyer_mensuel=1000,
                statut=Bien.StatutBien.DISPONIBLE
            )
            
            if i % 2 == 0:
                c = Contrat.objects.create(
                    bien=b,
                    locataire=self.locataire,
                    type_contrat=Contrat.TypeContrat.LOCATION,
                    statut=Contrat.StatutContrat.ACTIF,
                    date_debut=now.date() - timedelta(days=200),
                    date_fin=now.date() + timedelta(days=200),
                    loyer=1000,
                    depot_garantie=1000
                )
                
                # Create 12 paiements for this contract
                for j in range(12):
                    date_ech = now.date() - timedelta(days=(6-j)*30)
                    statut = Paiement.StatutPaiement.PAYE if j < 6 else Paiement.StatutPaiement.EN_ATTENTE
                    Paiement.objects.create(
                        contrat=c,
                        date_echeance=date_ech,
                        date_paiement=date_ech if statut == Paiement.StatutPaiement.PAYE else None,
                        montant_attendu=1000,
                        montant=1000,
                        montant_paye=1000 if statut == Paiement.StatutPaiement.PAYE else 0,
                        statut=statut,
                        num_echeance=j+1
                    )
                    
        for i in range(20):
            Notification.objects.create(
                utilisateur=self.user,
                titre="Test",
                message="Test",
                lu=False
            )
            
        self.factory = RequestFactory()
        
    def profile_view(self, view_class, view_name):
        request = self.factory.get('/')
        force_authenticate(request, user=self.user)
        
        view = view_class.as_view()
        
        # Warmup
        view(request)
        
        reset_queries()
        
        start_time = time.time()
        response = view(request)
        end_time = time.time()
        
        queries = connection.queries
        num_queries = len(queries)
        sql_time = sum(float(q.get('time', 0)) for q in queries)
        
        response.render()
        content = response.content
        json_size = len(content)
        
        print(f"\n--- {view_name} ---")
        print(f"Temps de rponse    : {(end_time - start_time)*1000:.2f} ms")
        print(f"Nombre de requtes  : {num_queries}")
        print(f"Temps excution SQL : {sql_time*1000:.2f} ms")
        print(f"Taille JSON         : {json_size / 1024:.2f} KB")
        
        return json.loads(content)

    def test_performance(self):
        print("\n[Profilage des performances]")
        data_old = self.profile_view(ProprietaireDashboardView, "Ancienne view (Non optimise)")
        data_new = self.profile_view(ProprietaireDashboardOptimizedView, "Nouvelle view (Optimise)")
        
        # Verify correctness
        self.assertEqual(data_old['biens']['total'], data_new['biens']['total'])
        self.assertEqual(data_old['biens']['loues'], data_new['biens']['loues'])
        self.assertEqual(data_old['revenus']['ce_mois'], data_new['revenus']['ce_mois'])
        self.assertEqual(data_old['prochaine_echeance']['nombre'], data_new['prochaine_echeance']['nombre'])
        print("\n-> OK Les deux vues retournent des donnes fonctionnelles identiques !")

if __name__ == '__main__':
    import unittest
    unittest.main()
