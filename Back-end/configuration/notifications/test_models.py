from django.test import TestCase
from utilisateur.models import Utilisateur
from notifications.models import Notification

class NotificationModelTests(TestCase):
    def test_notification_creation(self):
        u = Utilisateur.objects.create_user(email="test@t.com", password="pwd")
        n = Notification.objects.create(
            utilisateur=u,
            type=Notification.Type.AUTRE,
            message="Test message"
        )
        self.assertEqual(n.utilisateur, u)
        self.assertEqual(n.type, Notification.Type.AUTRE)
        self.assertFalse(n.lu)
        
        self.assertTrue(isinstance(str(n), str))

    def test_notification_marquer_lue(self):
        u = Utilisateur.objects.create_user(email="test2@t.com", password="pwd")
        n = Notification.objects.create(
            utilisateur=u,
            type=Notification.Type.ECHEANCE_LOYER,
            message="Test"
        )
        n.lu = True
        n.save()
        self.assertTrue(n.lu)
