import React from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { AgentDashboardData } from '../hooks/useAgentDashboard';
import Link from 'next/link';

export function ImpayesStats({ data }: { data: AgentDashboardData }) {
  const { paiements } = data;
  
  const retards = paiements.filter(p => {
    if (p.statut === 'PAYE' || p.statut === 'VALIDE' || p.statut === 'ANNULE') return false;
    const limit = new Date();
    limit.setDate(limit.getDate() - 5);
    return new Date(p.date_echeance) < limit;
  });
  
  const impayesTotal = retards.reduce((sum, p) => sum + parseFloat(p.montant_restant || p.montant || '0'), 0);
  const locatairesImpayes = new Set(retards.map(p => p.locataire_nom)).size;

  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Total des impayés</h2>
          <p>Retards de plus de 5 jours</p>
        </div>
        <div style={{ padding: '8px 12px', background: '#fff0f1', color: 'var(--red)', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={14} /> {retards.length} alerte(s)
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: 'auto' }}>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--red)' }}>{impayesTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Montant cumulé</span>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--orange)' }}>{locatairesImpayes}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Locataires</span>
        </div>
      </div>
      
      <Link href="/agent/paiements" className="link-button" style={{ marginTop: '16px', justifyContent: 'center', color: 'var(--red)' }}>
        Gérer les relances <ArrowRight size={14} />
      </Link>
    </section>
  );
}
