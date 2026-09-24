import fs from 'fs';
let s = fs.readFileSync('components/organisms/PriorityPaiements.tsx', 'utf8');
s = s.replace(/<AgentActions[\s\S]*?onUpdate\(updated\)[\s\S]*?\}\s*\/>/, '<button onClick={() => setSelectedPaiement(p)} className="outline-button" style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}><Eye size={14} /> Visualiser</button>');
s = s.replace(/import \{ AlertCircle, Clock, CheckCircle2, User \} from 'lucide-react'/, 'import { AlertCircle, Clock, CheckCircle2, User, Eye } from "lucide-react"');

// Fix FactureModal onStatusChange
s = s.replace(/onClose=\{\(\) => setSelectedPaiement\(null\)\}/, 'onClose={() => setSelectedPaiement(null)} onStatusChange={(updated) => onUpdate(updated)}');

fs.writeFileSync('components/organisms/PriorityPaiements.tsx', s, 'utf8');
