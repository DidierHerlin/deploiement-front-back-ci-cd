from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from utilisateur.models import Utilisateur, Locataire, Proprietaire
from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from datetime import date
from django.utils import timezone
from dateutil.relativedelta import relativedelta

class PaiementViewsTests(APITestCase):
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
            date_debut=timezone.now().date(), date_fin=timezone.now().date() + relativedelta(months=12), 
            loyer=1000, depot_garantie=1000
        )
        Paiement.objects.all().delete()
        self.paiement = Paiement.objects.create(
            contrat=self.contrat, date_echeance=timezone.now().date() + relativedelta(months=1),
            montant=1000, montant_attendu=1000
        )

    def test_list_paiements(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_paiement(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f"/api/paiements/{self.paiement.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_valider_paiement(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f"/api/paiements/{self.paiement.id}/valider/", {"mode_paiement": "ESPECE"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paiement.refresh_from_db()
        self.assertEqual(self.paiement.statut, Paiement.StatutPaiement.PAYE)
