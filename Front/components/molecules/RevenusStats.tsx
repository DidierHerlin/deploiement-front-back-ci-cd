import React from 'react';
import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AgentDashboardData } from '../hooks/useAgentDashboard';
import Link from 'next/link';

export function RevenusStats({ data }: { data: AgentDashboardData }) {
  const { paiements } = data;
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;

  let revCurrent = 0;
  let revLast = 0;

  paiements.forEach(p => {
    if (p.statut === 'PAYE' && p.date_paiement) {
      const d = new Date(p.date_paiement);
      const val = parseFloat(p.loyer_contrat || '0');
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        revCurrent += val;
      } else if (d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth) {
        revLast += val;
      }
    }
  });

  const trend = revLast > 0 ? ((revCurrent - revLast) / revLast) * 100 : 0;
  const isPositive = trend >= 0;

  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Revenus locatifs</h2>
          <p>Cumulés ce mois-ci</p>
        </div>
        {revLast > 0 && (
          <div style={{ padding: '8px 12px', background: isPositive ? '#eff5ff' : '#fff0f1', color: isPositive ? 'var(--primary)' : 'var(--red)', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend).toFixed(1)} %
          </div>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: 'auto' }}>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--primary)' }}>{revCurrent.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mois en cours</span>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--text-secondary)' }}>{revLast.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mois précédent</span>
        </div>
      </div>
      
      <Link href="/agent/paiements" className="link-button" style={{ marginTop: '16px', justifyContent: 'center' }}>
        Voir les paiements <ArrowRight size={14} />
      </Link>
    </section>
  );
}
