from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from .models import TypeBien
from .serializers import TypeBienSerializer


class TypeBienModelTests(TestCase):
    def test_str(self):
        tb = TypeBien.objects.create(designation="Appartement")
        self.assertEqual(str(tb), "Appartement")

    def test_strip_espaces(self):
        tb = TypeBien.objects.create(designation="  Maison  ")
        self.assertEqual(tb.designation, "Maison")


class TypeBienSerializerTests(TestCase):
    def test_valide(self):
        serializer = TypeBienSerializer(data={"designation": "Studio"})
        self.assertTrue(serializer.is_valid())

    def test_vide_invalide(self):
        serializer = TypeBienSerializer(data={"designation": "   "})
        self.assertFalse(serializer.is_valid())
        self.assertIn("designation", serializer.errors)

    def test_court_invalide(self):
        serializer = TypeBienSerializer(data={"designation": "A"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("designation", serializer.errors)

    def test_doublon_invalide(self):
        TypeBien.objects.create(designation="Villa")
        serializer = TypeBienSerializer(data={"designation": "villa"})
        self.assertFalse(serializer.is_valid())

    def test_mise_a_jour_meme_instance(self):
        tb = TypeBien.objects.create(designation="Chalet")
        serializer = TypeBienSerializer(instance=tb, data={"designation": "Chalet"})
        self.assertTrue(serializer.is_valid())


class TypeBienAPITests(APITestCase):
    url = "/api/types-biens/"

    def setUp(self):
        self.item = TypeBien.objects.create(designation="Appartement")

    def test_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve(self):
        response = self.client.get(f"{self.url}{self.item.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["designation"], "Appartement")

    def test_create(self):
        response = self.client.post(self.url, {"designation": "Maison"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TypeBien.objects.filter(designation="Maison").exists())

    def test_create_vide_echoue(self):
        response = self.client.post(self.url, {"designation": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update(self):
        response = self.client.put(f"{self.url}{self.item.id}/", {"designation": "Duplex"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.designation, "Duplex")

    def test_partial_update(self):
        response = self.client.patch(f"{self.url}{self.item.id}/", {"designation": "Loft"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.designation, "Loft")

    def test_delete(self):
        response = self.client.delete(f"{self.url}{self.item.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TypeBien.objects.filter(id=self.item.id).exists())

    def test_not_found(self):
        response = self.client.get(f"{self.url}99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
