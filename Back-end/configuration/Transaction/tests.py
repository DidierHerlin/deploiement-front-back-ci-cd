from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionModelTests(TestCase):
    def test_str(self):
        t = Transaction.objects.create(nomTransaction="Location")
        self.assertEqual(str(t), "Location")

    def test_strip_espaces(self):
        t = Transaction.objects.create(nomTransaction="  Vente  ")
        self.assertEqual(t.nomTransaction, "Vente")


class TransactionSerializerTests(TestCase):
    def test_valide(self):
        serializer = TransactionSerializer(data={"nomTransaction": "Location"})
        self.assertTrue(serializer.is_valid())

    def test_vide_invalide(self):
        serializer = TransactionSerializer(data={"nomTransaction": "   "})
        self.assertFalse(serializer.is_valid())
        self.assertIn("nomTransaction", serializer.errors)

    def test_court_invalide(self):
        serializer = TransactionSerializer(data={"nomTransaction": "A"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("nomTransaction", serializer.errors)

    def test_doublon_invalide(self):
        Transaction.objects.create(nomTransaction="Vente")
        serializer = TransactionSerializer(data={"nomTransaction": "vente"})
        self.assertFalse(serializer.is_valid())

    def test_mise_a_jour_meme_instance(self):
        t = Transaction.objects.create(nomTransaction="Bail commercial")
        serializer = TransactionSerializer(instance=t, data={"nomTransaction": "Bail commercial"})
        self.assertTrue(serializer.is_valid())


class TransactionAPITests(APITestCase):
    url = "/api/transactions/"

    @classmethod
    def setUpTestData(cls):
        cls.item = Transaction.objects.create(nomTransaction="Location")

    def setUp(self):
        self.item.refresh_from_db()

    def test_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve(self):
        response = self.client.get(f"{self.url}{self.item.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nomTransaction"], "Location")

    def test_create(self):
        response = self.client.post(self.url, {"nomTransaction": "Vente"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Transaction.objects.filter(nomTransaction="Vente").exists())

    def test_create_vide_echoue(self):
        response = self.client.post(self.url, {"nomTransaction": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update(self):
        response = self.client.put(f"{self.url}{self.item.id}/", {"nomTransaction": "Location meublée"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.nomTransaction, "Location meublée")

    def test_partial_update(self):
        response = self.client.patch(f"{self.url}{self.item.id}/", {"nomTransaction": "Location saisonnière"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.nomTransaction, "Location saisonnière")

    def test_delete(self):
        response = self.client.delete(f"{self.url}{self.item.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Transaction.objects.filter(id=self.item.id).exists())

    def test_not_found(self):
        response = self.client.get(f"{self.url}99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
