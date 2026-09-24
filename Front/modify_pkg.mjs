import fs from 'fs';
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.test = 'vitest';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
