from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from utilisateur.models import Utilisateur, Proprietaire, Locataire
from bien.models import Bien
from contrats.models import Contrat
from .models import Paiement


class PaiementAPITestCase(APITestCase):
    def setUp(self):
        # Création des utilisateurs
        self.admin = Utilisateur.objects.create_superuser(
            email="admin@test.com", password="pass", nom="Admin", prenoms="Test"
        )
        self.agent = Utilisateur.objects.create_user(
            email="agent@test.com", password="pass", role=Utilisateur.Role.AGENT,
            nom="Agent", prenoms="Test"
        )
        self.locataire_user = Utilisateur.objects.create_user(
            email="loc@test.com", password="pass", role=Utilisateur.Role.LOCATAIRE,
            nom="Dupont", prenoms="Jean"
        )
        self.locataire = Locataire.objects.create(user=self.locataire_user)
        self.proprietaire_user = Utilisateur.objects.create_user(
            email="proprio@test.com", password="pass", role=Utilisateur.Role.PROPRIETAIRE,
            nom="Rakoto", prenoms="Jean"
        )
        self.proprietaire = Proprietaire.objects.create(user=self.proprietaire_user, iban="FR123")

        # Création d'un bien et d'un contrat de location
        self.bien = Bien.objects.create(
            proprietaire=self.proprietaire,
            titre="Appartement F3",
            type="APPARTEMENT",
            mode_transaction="LOCATION",
            adresse="Tana",
            surface=80,
            nombre_pieces=3,
            loyer_mensuel=500000,
            statut=Bien.StatutBien.DISPONIBLE
        )
        self.contrat = Contrat.objects.create(
            bien=self.bien,
            locataire=self.locataire,
            type_contrat=Contrat.TypeContrat.LOCATION,
            date_debut=timezone.now().date() - timezone.timedelta(days=30),
            date_fin=timezone.now().date() + timezone.timedelta(days=335),
            loyer=500000,
            depot_garantie=1000000,
            statut=Contrat.StatutContrat.ACTIF
        )
        self.client.force_authenticate(user=self.agent)

    def test_creer_paiement_complet(self):
        url = reverse("paiement-list")
        data = {
            "contrat": self.contrat.id,
            "montant": 500000,
            "mode_paiement": "VIREMENT",
            "reference": "",
            "est_partiel": False
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["montant"], "500000.00")
        self.assertEqual(response.data["statut"], "EN_ATTENTE")

    def test_creer_paiement_montant_incoherent(self):
        url = reverse("paiement-list")
        data = {
            "contrat": self.contrat.id,
            "montant": 300000,  # différent du loyer
            "mode_paiement": "VIREMENT",
            "reference": "",
            "est_partiel": False
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("montant", response.data)

    def test_creer_paiement_mobile_sans_reference(self):
        url = reverse("paiement-list")
        data = {
            "contrat": self.contrat.id,
            "montant": 500000,
            "mode_paiement": "MVOLA",
            "reference": "",
            "est_partiel": False
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reference", response.data)

    def test_validation_paiement(self):
        paiement = Paiement.objects.create(
            contrat=self.contrat,
            date_echeance="2026-10-05",
            montant=500000,
            mode_paiement="VIREMENT",
            statut=Paiement.StatutPaiement.EN_ATTENTE
        )
        url = reverse("paiement-valider", args=[paiement.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        paiement.refresh_from_db()
        self.assertEqual(paiement.statut, Paiement.StatutPaiement.PAYE)