import fs from 'fs';
let s = fs.readFileSync('../.github/workflows/ci-backend.yml', 'utf8');

// 1. Replace the test run step
let oldTestStep =       - name: Lancer les tests Django
        run: |
          if python manage.py test --verbosity=0 > test_output.log 2>&1; then
            echo "Teste reu avec succes"
          else
            cat test_output.log
            exit 1
          fi;

let newTestStep =       - name: Lancer les tests Django
        run: |
          if coverage run manage.py test --verbosity=0 > test_output.log 2>&1; then
            echo "Teste reçu avec succes"
            coverage xml
          else
            cat test_output.log
            exit 1
          fi

      - name: Sauvegarder le rapport de couverture
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: Back-end/configuration/coverage.xml;

s = s.replace(/      - name: Lancer les tests Django[\s\S]*?fi\n/, newTestStep + '\n');

// 2. Add download artifact step before SonarQube analysis
let downloadStep =       - name: Récupérer le rapport de couverture
        uses: actions/download-artifact@v4
        with:
          name: coverage-report
          path: Back-end/configuration/

      - name: Analyse SonarQube;

s = s.replace(/      - name: Analyse SonarQube/, downloadStep);

// 3. Add coverage report path back to SonarQube args
let oldSonarArgs = -Dsonar.python.version=3.11;
let newSonarArgs = -Dsonar.python.version=3.11\n            -Dsonar.python.coverage.reportPaths=coverage.xml;
s = s.replace(oldSonarArgs, newSonarArgs);

fs.writeFileSync('../.github/workflows/ci-backend.yml', s, 'utf8');
