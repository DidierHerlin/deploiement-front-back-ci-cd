import React from 'react';
import { ArrowRight, Home } from 'lucide-react';
import { AgentDashboardData } from '../hooks/useAgentDashboard';
import Link from 'next/link';

export function OccupationStats({ data }: { data: AgentDashboardData }) {
  const { biens } = data;
  
  const totalBiens = biens.length;
  const loues = biens.filter(b => b.statut === 'LOUE').length;
  const occupationRate = totalBiens > 0 ? ((loues / totalBiens) * 100).toFixed(1) : '0.0';

  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Taux d'occupation</h2>
          <p>Performance locative</p>
        </div>
        <div style={{ padding: '8px 12px', background: '#eff5ff', color: 'var(--primary)', borderRadius: '8px', fontWeight: 'bold' }}>
          {occupationRate} %
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: 'auto' }}>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--primary)' }}>{loues}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Biens occupés</span>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--navy)' }}>{totalBiens}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Biens gérés</span>
        </div>
      </div>
      
      <Link href="/agent/biens" className="link-button" style={{ marginTop: '16px', justifyContent: 'center' }}>
        Voir les biens <ArrowRight size={14} />
      </Link>
    </section>
  );
}
