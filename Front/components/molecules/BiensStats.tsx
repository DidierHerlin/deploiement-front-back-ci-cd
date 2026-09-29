import React from 'react';
import { Building2, FileText, Users, Wallet, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import Link from 'next/link';

interface BiensStatsProps {
  data: AdminDashboardData;
}

export function BiensStats({ data }: BiensStatsProps) {
  const { biens } = data;
  
  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Parc Immobilier</h2>
          <p>Vue d'ensemble de vos biens</p>
        </div>
        <div style={{ padding: '8px 12px', background: '#eff5ff', color: 'var(--primary)', borderRadius: '8px', fontWeight: 'bold' }}>
          {biens.total} biens au total
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: 'auto' }}>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--green)' }}>{biens.dispo}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Disponibles</span>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--primary)' }}>{biens.loue}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Loués</span>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: '#64748b' }}>{biens.vendu}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Vendus</span>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--orange)' }}>{biens.travaux}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>En travaux</span>
        </div>
      </div>
      
      <Link href="/admin/bien" className="link-button" style={{ marginTop: '16px', justifyContent: 'center' }}>
        Gérer les biens <ArrowRight size={14} />
      </Link>
    </section>
  );
}
