const fs = require('fs');
let s = fs.readFileSync('../.github/workflows/ci-backend.yml', 'utf8');
s = s.replace(
  /      - name: Lancer les tests Django\r?\n        run: python manage\.py test/,
  '      - name: Lancer les tests Django\n        run: |\n          if python manage.py test --verbosity=0 > test_output.log 2>&1; then\n            echo "Teste reçu avec succes"\n          else\n            cat test_output.log\n            exit 1\n          fi'
);
fs.writeFileSync('../.github/workflows/ci-backend.yml', s, 'utf8');
