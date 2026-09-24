import fs from 'fs';
let s = fs.readFileSync('../.github/workflows/ci-backend.yml', 'utf8');

// Remove upload-artifact
s = s.replace(/\s*- name: Sauvegarder le rapport de couverture\s*uses: actions\/upload-artifact@v4\s*with:\s*name: coverage-report\s*path: Back-end\/configuration\/coverage\.xml/g, '');

// Remove download-artifact
s = s.replace(/\s*- name: Rcuprer le rapport de couverture\s*uses: actions\/download-artifact@v4\s*with:\s*name: coverage-report\s*path: Back-end\/configuration\//g, '');
// Handle different encoding replacements
s = s.replace(/\s*- name: R.cup.rer le rapport de couverture\s*uses: actions\/download-artifact@v4\s*with:\s*name: coverage-report\s*path: Back-end\/configuration\//g, '');

// Remove SonarQube coverage line
s = s.replace(/\s*-Dsonar\.python\.coverage\.reportPaths=coverage\.xml/g, '');

fs.writeFileSync('../.github/workflows/ci-backend.yml', s, 'utf8');
