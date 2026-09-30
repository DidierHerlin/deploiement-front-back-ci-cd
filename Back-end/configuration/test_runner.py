import sys
import coverage
from django.test.runner import DiscoverRunner


class CoverageRunner(DiscoverRunner):
    """
    Test runner personnalise qui execute automatiquement coverage.py
    et echoue si la couverture est inferieure au seuil defini (80%).

    Ordre d'execution :
      1. Demarre la mesure de couverture avant les tests
      2. Lance tous les tests Django normalement
      3. Arrete la couverture, genere les rapports (console + XML)
      4. Retourne un code d'echec si :
           - des tests ont echoue  (nombre_echecs > 0)
           - OU la couverture est < 80%
    """

    COVERAGE_THRESHOLD = 80  # Seuil minimal de couverture en %

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Demarre la mesure de couverture
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

    def run_tests(self, test_labels, **kwargs):
        """
        Point d'entree principal. On surcharge cette methode pour
        controler proprement le code de sortie final.
        """
        # Lance les tests et recupere le nombre d'echecs/erreurs
        failures = super().run_tests(test_labels, **kwargs)

        # Arrete la mesure de couverture
        self.cov.stop()
        self.cov.save()

        # Affiche le rapport de couverture
        coverage_ok = self._report_coverage()

        # Echec si des tests ont echoue OU si la couverture est insuffisante
        if failures or not coverage_ok:
            return 1  # -> exit code 1 dans manage.py test

        return 0  # -> exit code 0 : tout est bon

    def _report_coverage(self):
        """
        Affiche le rapport de couverture dans la console,
        genere le fichier XML pour SonarQube,
        et retourne True si le seuil est respecte.
        """
        print("\n" + "=" * 60)
        print("  Rapport de couverture (Test Coverage)")
        print("=" * 60 + "\n")

        # Rapport detaille ligne par ligne dans la console
        coverage_percentage = self.cov.report()

        # Rapport XML pour SonarQube / GitHub Actions
        self.cov.xml_report(outfile='coverage.xml')

        print(f"\nCouverture totale : {coverage_percentage:.2f}%")
        print(f"Seuil requis      : {self.COVERAGE_THRESHOLD}%")

        if coverage_percentage < self.COVERAGE_THRESHOLD:
            print(
                f"\nECHEC : La couverture ({coverage_percentage:.2f}%) "
                f"est inferieure au seuil de {self.COVERAGE_THRESHOLD}% !"
            )
            return False

        print(
            f"\nSUCCES : La couverture ({coverage_percentage:.2f}%) "
            f"respecte le seuil de {self.COVERAGE_THRESHOLD}% !"
        )
        return True
