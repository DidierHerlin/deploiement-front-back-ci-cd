import sys
import coverage
from django.test.runner import DiscoverRunner

class CoverageRunner(DiscoverRunner):
    """
    Test runner personnalisé qui exécute automatiquement coverage.py
    et échoue si la couverture est inférieure au seuil défini.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if hasattr(sys, '_called_cov'):
            self.cov = sys._called_cov
        else:
            self.cov = coverage.Coverage(
                source=['.'],
                omit=[
                    '*/migrations/*',
                    'manage.py',
                    '*/tests.py',
                    '*/test_*.py',
                    '*/tests_*.py',
                    'test_reporting.py',
                    'test_runner.py',
                    'performance_test.py',
                    'check_user.py',
                    'scratch/*',
                    '*/apps.py',
                    '*/admin.py',
                    '*/venv/*',
                    '*/.venv/*',
                ]
            )
            self.cov.start()

    def teardown_test_environment(self, **kwargs):
        super().teardown_test_environment(**kwargs)
        self.cov.stop()
        self.cov.save()
        
        print("\n" + "="*50)
        print("Rapport de couverture (Test Coverage) :")
        print("="*50 + "\n")
        
        # Affiche le rapport détaillé dans la console
        coverage_percentage = self.cov.report()
        
        # Génère le fichier XML pour SonarQube (GitHub Actions)
        self.cov.xml_report(outfile='coverage.xml')
        
        print(f"\nCouverture totale : {coverage_percentage:.2f}%")
        
        if coverage_percentage < 80:
            print("\nERREUR : La couverture des tests est inferieure a 80% !")
            sys.exit(1)
        else:
            print("\nSUCCES : La couverture des tests respecte le seuil de 80% !")
