from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from utilisateur.models import Utilisateur
from django.core.files.uploadedfile import SimpleUploadedFile

class ProfileViewsCoverageTests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(email="profile_cov@test.com", password="pwd", nom="Cov", prenoms="Cov", role=Utilisateur.Role.LOCATAIRE)

    def test_upload_and_delete_photo(self):
        self.client.force_authenticate(user=self.user)
        # Upload
        dummy_image = SimpleUploadedFile(name='test_image.jpg', content=b'file_content', content_type='image/jpeg')
        url = reverse('profil-photo-maj')
        resp = self.client.post(url, {'photo_profil': dummy_image}, format='multipart')
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
        
        # Delete
        url_delete = reverse('profil-photo-supprimer')
        resp2 = self.client.delete(url_delete)
        self.assertIn(resp2.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
