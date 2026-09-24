import fs from 'fs';
let s = fs.readFileSync('../Back-end/configuration/paiement/templates/paiement/quittance_template.html', 'utf8');
s = s.replace(/<table class="grid" role="presentation">[\s\S]*?<th([^>]+)>([\s\S]*?)<\/th>[\s\S]*?<th([^>]+)>([\s\S]*?)<\/th>[\s\S]*?<\/table>/, 
  '<table class="grid" role="presentation">\n    <tr>\n      <td></td>\n      <td></td>\n    </tr>\n  </table>');
fs.writeFileSync('../Back-end/configuration/paiement/templates/paiement/quittance_template.html', s, 'utf8');
