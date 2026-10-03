from django.test import TestCase
from unittest.mock import patch
import profile_biens

class ProfileBiensTest(TestCase):
    @patch('profile_biens.print')
    def test_run_profile(self, mock_print):
        # On teste que le script profile_biens s'exécute sans erreur
        profile_biens.run_profile()
        self.assertTrue(mock_print.called)
