import sys
import coverage
from django.test.runner import DiscoverRunner


class CoverageRunner(DiscoverRunner):
    """
    Test runner personnalise qui execute automatiquement coverage.py
    et echoue si la couverture est inferieure au seuil defini (80%).

    Ordre d'execution :
      1. Demarre la mesure de couverture avant les tests (ou reutilise l'instance active)
      2. Lance tous les tests Django normalement
      3. Arrete la couverture, genere les rapports (console + XML)
      4. Retourne un code d'echec si :
           - des tests ont echoue  (nombre_echecs > 0)
           - OU la couverture est < 80% (lors de l'execution complete)
      5. Retourne explicitement sys.exit(0) si la couverture >= 80% et 0 echec
    """

    COVERAGE_THRESHOLD = 80  # Seuil minimal de couverture en %

    OMIT_PATTERNS = [
        # Script d'attente de la base de données
        'wait_for_db.py',
        '*/wait_for_db.py',
        # Fichiers de migration
        '*/migrations/*',
        # Scripts utilitaires (non testables)
        'manage.py',
        'wsgi.py',
        'asgi.py',
        # Fichiers de test eux-mêmes
        '*/tests/*',
        '*/tests.py',
        'tests.py',
        '*/test.py',
        'test.py',
        '*/test_*.py',
        'test_*.py',
        '*/tests_*.py',
        'tests_*.py',
        'test_reporting.py',
        'test_runner.py',
        'profile_biens.py',
        'performance_test.py',
        'check_user.py',
        'scratch/*',
        '*/validators.py',
        '*/permissions.py',
        '*/models.py',
        # Boilerplate Django (apps, admin, urls)
        'settings.py',
        '*/settings.py',
        '*/apps.py',
        '*/admin.py',
        '*/urls.py',
        # Signals (testés indirectement via vues)
        '*/signals.py',
        # Environnements virtuels
        '*/venv/*',
        '*/.venv/*',
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Si coverage est déjà actif (ex: lancé via `coverage run manage.py test`)
        active_cov = coverage.Coverage.current()
        if active_cov is not None:
            self.cov = active_cov
            self._started_cov = False
        else:
            # Demarre la mesure de couverture
            self.cov = coverage.Coverage(
                config_file='.coveragerc',
                source=['.'],
                omit=self.OMIT_PATTERNS,
            )
            self.cov.start()
            self._started_cov = True

    def run_tests(self, test_labels, **kwargs):
        """
        Point d'entree principal. On surcharge cette methode pour
        controler proprement le code de sortie final.
        """
        # Lance les tests et recupere le nombre d'echecs/erreurs
        failures = super().run_tests(test_labels, **kwargs)

        # Arrete la mesure de couverture si nous l'avons demarree
        if self._started_cov:
            self.cov.stop()
        self.cov.save()

        # Affiche le rapport de couverture (le seuil de 80% s'applique si la suite complète est exécutée)
        is_targeted = bool(test_labels)
        coverage_ok = self._report_coverage(enforce_threshold=not is_targeted)

        # Echec si des tests ont echoue OU si la couverture est insuffisante
        if failures or not coverage_ok:
            sys.exit(1)

        # Succes : seuil >= 80% et tous les tests passent
        sys.exit(0)

    def _report_coverage(self, enforce_threshold=True):
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

        if not enforce_threshold:
            print("\nTests cibles executes : validation du seuil global de 80% ignoree pour cette execution partielle.")
            return True

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
