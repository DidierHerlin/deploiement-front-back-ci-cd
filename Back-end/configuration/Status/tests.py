from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from common.tests import (
    BaseReferentielModelTestsMixin,
    BaseReferentielSerializerTestsMixin,
)
from .models import Status
from .serializers import StatusSerializer


class StatusModelTests(BaseReferentielModelTestsMixin, TestCase):
    model_class = Status
    field_name = "typeStatus"


class StatusSerializerTests(BaseReferentielSerializerTestsMixin, TestCase):
    serializer_class = StatusSerializer
    model_class = Status
    field_name = "typeStatus"


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
