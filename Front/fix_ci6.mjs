import fs from 'fs';
let s = fs.readFileSync('../.github/workflows/ci-backend.yml', 'utf8');

let newTestStep = '      - name: Lancer les tests Django\n        run: |\n          if coverage run manage.py test --verbosity=0 > test_output.log 2>&1; then\n            echo "Teste reçu avec succes"\n            coverage xml\n          else\n            cat test_output.log\n            exit 1\n          fi\n\n      - name: Sauvegarder le rapport de couverture\n        uses: actions/upload-artifact@v4\n        with:\n          name: coverage-report\n          path: Back-end/configuration/coverage.xml';

s = s.replace(/      - name: Lancer les tests Django[\s\S]*?fi\n/, newTestStep + '\n');

let downloadStep = '      - name: Récupérer le rapport de couverture\n        uses: actions/download-artifact@v4\n        with:\n          name: coverage-report\n          path: Back-end/configuration/\n\n      - name: Analyse SonarQube';

s = s.replace(/      - name: Analyse SonarQube/, downloadStep);

let oldSonarArgs = '-Dsonar.python.version=3.11';
let newSonarArgs = '-Dsonar.python.version=3.11\n            -Dsonar.python.coverage.reportPaths=coverage.xml';
s = s.replace(oldSonarArgs, newSonarArgs);

fs.writeFileSync('../.github/workflows/ci-backend.yml', s, 'utf8');
