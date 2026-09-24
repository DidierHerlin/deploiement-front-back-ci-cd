import fs from 'fs';
let s = fs.readFileSync('../.github/workflows/ci-backend.yml', 'utf8');

// Revert back to python manage.py test since test_runner.py already handles coverage internally
s = s.replace('if coverage run manage.py test --verbosity=0 > test_output.log 2>&1; then', 'if python manage.py test --verbosity=0 > test_output.log 2>&1; then');

// Remove the redundant coverage xml since test_runner.py does self.cov.xml_report(outfile='coverage.xml')
s = s.replace('            echo "Teste reçu avec succes"\n            coverage xml', '            echo "Teste reçu avec succes"');

fs.writeFileSync('../.github/workflows/ci-backend.yml', s, 'utf8');
