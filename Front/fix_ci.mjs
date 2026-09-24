const fs = require('fs');
let s = fs.readFileSync('../.github/workflows/ci-backend.yml', 'utf8');
s = s.replace(
  /      - name: Lancer les tests Django\r?\n        run: python manage\.py test/,
        - name: Lancer les tests Django
        run: |
          if python manage.py test --verbosity=0 > test_output.log 2>&1; then
            echo "Teste reçu avec succes"
          else
            cat test_output.log
            exit 1
          fi
);
fs.writeFileSync('../.github/workflows/ci-backend.yml', s, 'utf8');
