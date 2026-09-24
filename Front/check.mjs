const fs = require('fs');
let s = fs.readFileSync('components/organisms/PaiementTable.tsx', 'utf8');
s = s.replace(/Rf \/ chance/g, 'Réf / Échéance');
s = s.replace(/R\xef\xbf\xbd/g, 'Réf');
// Actually let's just write the literal file from node!
