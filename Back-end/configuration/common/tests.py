from rest_framework import status


class BaseReferentielModelTestsMixin:
    """Tests communs pour les modèles de référentiel."""
    model_class = None
    field_name = ""

    def test_str(self):
        obj = self.model_class.objects.create(**{self.field_name: "ValeurTest"})
        self.assertEqual(str(obj), "ValeurTest")

    def test_strip_espaces(self):
        obj = self.model_class.objects.create(**{self.field_name: "  ValeurAvecEspaces  "})
        self.assertEqual(getattr(obj, self.field_name), "ValeurAvecEspaces")


class BaseReferentielSerializerTestsMixin:
    """Tests communs pour les sérialiseurs de référentiel."""
    serializer_class = None
    model_class = None
    field_name = ""

    def test_valide(self):
        serializer = self.serializer_class(data={self.field_name: "ValeurValide"})
        self.assertTrue(serializer.is_valid())

    def test_vide_invalide(self):
        serializer = self.serializer_class(data={self.field_name: "   "})
        self.assertFalse(serializer.is_valid())
        self.assertIn(self.field_name, serializer.errors)

    def test_court_invalide(self):
        serializer = self.serializer_class(data={self.field_name: "A"})
        self.assertFalse(serializer.is_valid())
        self.assertIn(self.field_name, serializer.errors)

    def test_doublon_invalide(self):
        self.model_class.objects.create(**{self.field_name: "DoublonTest"})
        serializer = self.serializer_class(data={self.field_name: "doublontest"})
        self.assertFalse(serializer.is_valid())

    def test_mise_a_jour_meme_instance(self):
        obj = self.model_class.objects.create(**{self.field_name: "Original"})
        serializer = self.serializer_class(instance=obj, data={self.field_name: "Original"})
        self.assertTrue(serializer.is_valid())


class BaseReferentielAPITestsMixin:
    """Tests communs pour les endpoints API de référentiel."""
    model_class = None
    field_name = ""
    url = ""

    def test_liste(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_detail(self):
        resp = self.client.get(f"{self.url}{self.item.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_creation(self):
        resp = self.client.post(self.url, {self.field_name: "NouveauElement"})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_suppression(self):
        resp = self.client.delete(f"{self.url}{self.item.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
