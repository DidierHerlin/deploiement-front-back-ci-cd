import fs from 'fs';
let s = fs.readFileSync('components/organisms/paiements_PaiementList.tsx', 'utf8');
s = s.replace(/<AgentActions[\s\S]*?<\/button>\s*\)\}/, '<button onClick={() => setSelectedPaiement(paiement)} className="outline-button" style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}><Eye size={14} /> Visualiser</button>');
fs.writeFileSync('components/organisms/paiements_PaiementList.tsx', s, 'utf8');
