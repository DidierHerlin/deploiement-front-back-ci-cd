from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Status
from .serializers import StatusSerializer


class StatusModelTests(TestCase):
    def test_str(self):
        s = Status.objects.create(typeStatus="Disponible")
        self.assertEqual(str(s), "Disponible")

    def test_strip_espaces(self):
        s = Status.objects.create(typeStatus="  Loué  ")
        self.assertEqual(s.typeStatus, "Loué")


class StatusSerializerTests(TestCase):
    def test_valide(self):
        serializer = StatusSerializer(data={"typeStatus": "Disponible"})
        self.assertTrue(serializer.is_valid())

    def test_vide_invalide(self):
        serializer = StatusSerializer(data={"typeStatus": "   "})
        self.assertFalse(serializer.is_valid())
        self.assertIn("typeStatus", serializer.errors)

    def test_court_invalide(self):
        serializer = StatusSerializer(data={"typeStatus": "A"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("typeStatus", serializer.errors)

    def test_doublon_invalide(self):
        Status.objects.create(typeStatus="Vendu")
        serializer = StatusSerializer(data={"typeStatus": "vendu"})
        self.assertFalse(serializer.is_valid())

    def test_mise_a_jour_meme_instance(self):
        s = Status.objects.create(typeStatus="En attente")
        serializer = StatusSerializer(instance=s, data={"typeStatus": "En attente"})
        self.assertTrue(serializer.is_valid())


class StatusAPITests(APITestCase):
    url = "/api/status/"

    @classmethod
    def setUpTestData(cls):
        cls.item = Status.objects.create(typeStatus="Disponible")

    def setUp(self):
        self.item.refresh_from_db()

    def test_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve(self):
        response = self.client.get(f"{self.url}{self.item.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["typeStatus"], "Disponible")

    def test_create(self):
        response = self.client.post(self.url, {"typeStatus": "Loué"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Status.objects.filter(typeStatus="Loué").exists())

    def test_create_vide_echoue(self):
        response = self.client.post(self.url, {"typeStatus": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update(self):
        response = self.client.put(f"{self.url}{self.item.id}/", {"typeStatus": "Réservé"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.typeStatus, "Réservé")

    def test_partial_update(self):
        response = self.client.patch(f"{self.url}{self.item.id}/", {"typeStatus": "En travaux"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.typeStatus, "En travaux")

    def test_delete(self):
        response = self.client.delete(f"{self.url}{self.item.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Status.objects.filter(id=self.item.id).exists())

    def test_not_found(self):
        response = self.client.get(f"{self.url}99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
