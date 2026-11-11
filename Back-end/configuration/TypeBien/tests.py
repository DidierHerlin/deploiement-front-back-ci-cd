from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from common.tests import (
    BaseReferentielModelTestsMixin,
    BaseReferentielSerializerTestsMixin,
)
from .models import TypeBien
from .serializers import TypeBienSerializer


class TypeBienModelTests(BaseReferentielModelTestsMixin, TestCase):
    model_class = TypeBien
    field_name = "designation"


class TypeBienSerializerTests(BaseReferentielSerializerTestsMixin, TestCase):
    serializer_class = TypeBienSerializer
    model_class = TypeBien
    field_name = "designation"


class TypeBienAPITests(APITestCase):
    url = "/api/types-biens/"

    @classmethod
    def setUpTestData(cls):
        cls.item = TypeBien.objects.create(designation="Appartement")

    def setUp(self):
        self.item.refresh_from_db()

    def test_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve(self):
        response = self.client.get(f"{self.url}{self.item.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["designation"], "Appartement")

    def test_create(self):
        response = self.client.post(self.url, {"designation": "Villa"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TypeBien.objects.filter(designation="Villa").exists())

    def test_create_vide_echoue(self):
        response = self.client.post(self.url, {"designation": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update(self):
        response = self.client.put(f"{self.url}{self.item.id}/", {"designation": "Studio"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.designation, "Studio")

    def test_partial_update(self):
        response = self.client.patch(f"{self.url}{self.item.id}/", {"designation": "Duplex"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.designation, "Duplex")

    def test_delete(self):
        response = self.client.delete(f"{self.url}{self.item.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TypeBien.objects.filter(id=self.item.id).exists())

    def test_not_found(self):
        response = self.client.get(f"{self.url}99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
