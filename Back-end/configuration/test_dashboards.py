"""
Tests pour les vues de Dashboard et de Reporting.
Couvre : admin_dashboard_views, agent_dashboard_views, reporting_views.
"""

from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import path
from django.utils import timezone
from datetime import date
from dateutil.relativedelta import relativedelta

from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from admin_dashboard_views import AdminDashboardView
from agent_dashboard_views import AgentDashboardView
from reporting_views import ReportingStatsView


def _make_user(email, role):
    return Utilisateur.objects.create_user(email=email, password="pwd123", role=role)

def _make_bien(prop, titre="Bien", statut=Bien.StatutBien.DISPONIBLE):
    return Bien.objects.create(
        proprietaire=prop, titre=titre, type=Bien.TypeBien.APPARTEMENT,
        mode_transaction=Bien.ModeTransaction.LOCATION,
        adresse="Test", surface=50, nombre_pieces=2, loyer_mensuel=1000,
        statut=statut
    )

def _make_contrat(bien, loc):
    return Contrat.objects.create(
        bien=bien, locataire=loc, type_contrat=Contrat.TypeContrat.LOCATION,
        date_debut=date.today(), date_fin=date.today() + relativedelta(months=12),
        loyer=1000, depot_garantie=1000
    )


class DashboardTests(APITestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Add temporary URLs for the views to test them easily
        from django.urls import get_resolver
        from django.urls import path
        cls.old_urls = get_resolver().urlconf_module.urlpatterns
        get_resolver().urlconf_module.urlpatterns += [
            path("api/admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
            path("api/agent/dashboard/", AgentDashboardView.as_view(), name="agent-dashboard"),
            path("api/reporting/stats/", ReportingStatsView.as_view(), name="reporting-stats"),
        ]

    @classmethod
    def tearDownClass(cls):
        from django.urls import get_resolver
        get_resolver().urlconf_module.urlpatterns = cls.old_urls
        super().tearDownClass()

    def setUp(self):
        self.admin = _make_user("admin@d.com", Utilisateur.Role.ADMIN)
        self.agent = _make_user("agent@d.com", Utilisateur.Role.AGENT)
        self.prop_user = _make_user("prop@d.com", Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.prop_user, iban="MG123")
        self.loc_user = _make_user("loc@d.com", Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.loc_user)

        self.bien = _make_bien(self.prop)
        self.contrat = _make_contrat(self.bien, self.loc)

        Paiement.objects.all().delete()
        self.paiement = Paiement.objects.create(
            contrat=self.contrat, date_echeance=date.today() + relativedelta(months=1),
            montant=1000, montant_attendu=1000, statut=Paiement.StatutPaiement.PAYE,
            montant_paye=1000, date_paiement=date.today()
        )

    # ---------------------------------------------------------
    # Admin Dashboard Tests
    # ---------------------------------------------------------
    def test_admin_dashboard_as_admin_returns_200(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("biens", response.data)
        self.assertIn("contrats", response.data)
        self.assertIn("paiements", response.data)
        self.assertIn("utilisateurs", response.data)
        self.assertIn("recentEvents", response.data)

    def test_admin_dashboard_as_agent_returns_200(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_dashboard_as_proprietaire_returns_403(self):
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_dashboard_unauthenticated_returns_401(self):
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---------------------------------------------------------
    # Agent Dashboard Tests
    # ---------------------------------------------------------
    def test_agent_dashboard_as_agent_returns_200(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/agent/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("biens", response.data)
        self.assertIn("revenus", response.data)
        self.assertIn("impayes", response.data)
        self.assertIn("upcomingContracts", response.data)

    def test_agent_dashboard_as_locataire_returns_403(self):
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/agent/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_agent_dashboard_revenus_and_impayes(self):
        # Create an unpaid payment (overdue)
        Paiement.objects.create(
            contrat=self.contrat, date_echeance=date.today() - relativedelta(months=2),
            montant=1000, montant_attendu=1000, statut=Paiement.StatutPaiement.EN_ATTENTE
        )
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/agent/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["impayes"]["totalAmount"], 1000)
        self.assertGreater(len(response.data["revenus"]["chartData"]), 0)

    # ---------------------------------------------------------
    # Reporting Stats Tests
    # ---------------------------------------------------------
    def test_reporting_as_admin_returns_all(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/reporting/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["biens"]["total"], 1)
        self.assertEqual(response.data["contrats"]["total"], 1)
        self.assertEqual(response.data["paiements"]["total"], 1)
        self.assertIn("total_users", response.data["users"])

    def test_reporting_as_proprietaire_returns_filtered(self):
        # Create another bien not owned by this proprietaire
        other_prop_user = _make_user("prop2@d.com", Utilisateur.Role.PROPRIETAIRE)
        other_prop = Proprietaire.objects.create(user=other_prop_user, iban="MG123")
        _make_bien(other_prop, titre="Bien2")
        
        self.client.force_authenticate(user=self.prop_user)
        response = self.client.get("/api/reporting/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see own bien
        self.assertEqual(response.data["biens"]["total"], 1)
        self.assertEqual(response.data["contrats"]["total"], 1)
        self.assertEqual(response.data["users"], {})

    def test_reporting_as_locataire_returns_filtered(self):
        _make_bien(self.prop, titre="Bien Dispo pour Loc", statut=Bien.StatutBien.DISPONIBLE)
        self.client.force_authenticate(user=self.loc_user)
        response = self.client.get("/api/reporting/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["biens"]["total"], 1)
        self.assertEqual(response.data["contrats"]["total"], 1)
        self.assertEqual(response.data["users"], {})
