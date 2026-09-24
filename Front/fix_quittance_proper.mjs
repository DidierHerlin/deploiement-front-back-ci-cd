import fs from 'fs';
let s = fs.readFileSync('../Back-end/configuration/paiement/templates/paiement/quittance_template.html', 'utf8');

let startIndex = s.indexOf('<table class="grid" role="presentation">');
let endIndex = s.indexOf('</table>', startIndex);

let tableBlock = s.substring(startIndex, endIndex);
tableBlock = tableBlock.replace(/<th/g, '<td');
tableBlock = tableBlock.replace(/<\/th>/g, '</td>');

s = s.substring(0, startIndex) + tableBlock + s.substring(endIndex);

fs.writeFileSync('../Back-end/configuration/paiement/templates/paiement/quittance_template.html', s, 'utf8');
