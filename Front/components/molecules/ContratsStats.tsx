import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { AdminDashboardData } from '../hooks/useAdminDashboard';
import Link from 'next/link';

export function ContratsStats({ data }: { data: AdminDashboardData }) {
  const { contrats } = data;
  
  const actifs = contrats.filter(c => c.statut === 'ACTIF').length;
  const locations = contrats.filter(c => c.type_contrat === 'LOCATION').length;
  const ventes = contrats.filter(c => c.type_contrat === 'ACHAT').length;
  
  // Contrats expirant dans les 30 prochains jours
  const now = new Date();
  const next30 = new Date();
  next30.setDate(now.getDate() + 30);
  
  const expiring = contrats.filter(c => {
    if (c.statut !== 'ACTIF' || !c.date_fin) return false;
    const fin = new Date(c.date_fin);
    return fin >= now && fin <= next30;
  }).length;

  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Contrats</h2>
          <p>Suivi des baux et ventes</p>
        </div>
        <div style={{ padding: '8px 12px', background: '#eaf8f3', color: 'var(--green)', borderRadius: '8px', fontWeight: 'bold' }}>
          {actifs} actifs
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: 'auto' }}>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px' }}>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Location</span>
          <strong style={{ fontSize: '18px', color: 'var(--navy)' }}>{locations}</strong>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px' }}>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Vente</span>
          <strong style={{ fontSize: '18px', color: 'var(--navy)' }}>{ventes}</strong>
        </div>
      </div>
      
      {expiring > 0 && (
        <div style={{ marginTop: '12px', padding: '10px', background: '#fff7e8', color: 'var(--orange)', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} />
          <strong>{expiring} contrat(s)</strong> arrivent à échéance ce mois-ci.
        </div>
      )}
      
      <Link href="/admin/contrat" className="link-button" style={{ marginTop: '16px', justifyContent: 'center' }}>
        Gérer les contrats <ArrowRight size={14} />
      </Link>
    </section>
  );
}
