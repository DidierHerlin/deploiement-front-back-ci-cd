import React from 'react';
import { ArrowRight, Home } from 'lucide-react';
import { AgentDashboardData } from '../hooks/useAgentDashboard';
import Link from 'next/link';

export function DisponibiliteStats({ data }: { data: AgentDashboardData }) {
  const { biens } = data;
  
  const dispo = biens.filter(b => b.statut === 'DISPONIBLE').length;
  const travaux = biens.filter(b => b.statut === 'EN_TRAVAUX').length;
  const total = dispo + travaux;

  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Biens disponibles</h2>
          <p>À la recherche de locataires</p>
        </div>
        <div style={{ padding: '8px 12px', background: '#eff5ff', color: 'var(--primary)', borderRadius: '8px', fontWeight: 'bold' }}>
          {total} au total
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: 'auto' }}>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--orange)' }}>{dispo}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>À louer</span>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: '#64748b' }}>{travaux}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>En travaux</span>
        </div>
      </div>
      
      <Link href="/agent/biens" className="link-button" style={{ marginTop: '16px', justifyContent: 'center' }}>
        Gérer la disponibilité <ArrowRight size={14} />
      </Link>
    </section>
  );
}
