import fs from 'fs';
let s = fs.readFileSync('../.github/workflows/ci-backend.yml', 'utf8');

let startIndex = s.indexOf('      - name: Lancer les tests Django');
let endIndex = s.indexOf('code-quality:', startIndex);

let newTestBlock = '      - name: Lancer les tests Django\n        run: |\n          if coverage run manage.py test --verbosity=0 > test_output.log 2>&1; then\n            echo "Teste reçu avec succes"\n            coverage xml\n          else\n            cat test_output.log\n            exit 1\n          fi\n\n      - name: Sauvegarder le rapport de couverture\n        uses: actions/upload-artifact@v4\n        with:\n          name: coverage-report\n          path: Back-end/configuration/coverage.xml\n\n  ';

s = s.substring(0, startIndex) + newTestBlock + s.substring(endIndex);

fs.writeFileSync('../.github/workflows/ci-backend.yml', s, 'utf8');
