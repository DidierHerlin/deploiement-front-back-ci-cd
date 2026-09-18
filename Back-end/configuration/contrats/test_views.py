from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from datetime import date

class ContratViewsTests(APITestCase):
    def setUp(self):
        self.agent = Utilisateur.objects.create_user(email="agent@t.com", password="pwd", role=Utilisateur.Role.AGENT)
        self.u1 = Utilisateur.objects.create_user(email="p@t.com", password="pwd", role=Utilisateur.Role.PROPRIETAIRE)
        self.prop = Proprietaire.objects.create(user=self.u1)
        self.u2 = Utilisateur.objects.create_user(email="l@t.com", password="pwd", role=Utilisateur.Role.LOCATAIRE)
        self.loc = Locataire.objects.create(user=self.u2)

        self.bien_loc = Bien.objects.create(
            proprietaire=self.prop, titre="A", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=50,
            nombre_pieces=2, loyer_mensuel=1000, statut=Bien.StatutBien.DISPONIBLE
        )
        self.contrat = Contrat.objects.create(
            bien=self.bien_loc, locataire=self.loc, type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=date(2025, 1, 1), date_fin=date(2025, 12, 31), loyer=1000, depot_garantie=1000
        )

    def test_list_contrats(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/contrats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_retrieve_contrat(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f"/api/contrats/{self.contrat.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_contrat(self):
        self.client.force_authenticate(user=self.agent)
        b2 = Bien.objects.create(
            proprietaire=self.prop, titre="B", type=Bien.TypeBien.APPARTEMENT,
            mode_transaction=Bien.ModeTransaction.LOCATION, adresse="Test", surface=50,
            nombre_pieces=2, loyer_mensuel=500, statut=Bien.StatutBien.DISPONIBLE
        )
        data = {
            "bien": b2.id,
            "locataire": self.loc.id,
            "type_contrat": Contrat.TypeContrat.LOCATION,
            "date_debut": "2026-01-01",
            "date_fin": "2026-12-31",
            "loyer": 500,
            "depot_garantie": 500
        }
        response = self.client.post("/api/contrats/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
