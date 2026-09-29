import React from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import Link from 'next/link';

export function UtilisateursStats({ data }: { data: AdminDashboardData }) {
  const { utilisateurs } = data;
  
  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Communauté</h2>
          <p>Répartition des utilisateurs</p>
        </div>
        <div style={{ padding: '8px 12px', background: '#eff5ff', color: 'var(--primary)', borderRadius: '8px', fontWeight: 'bold' }}>
          {utilisateurs.total} inscrits
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: 'auto' }}>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Propriétaires</span>
          <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>{utilisateurs.proprietaires}</strong>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Locataires</span>
          <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>{utilisateurs.locataires}</strong>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Agents</span>
          <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>{utilisateurs.agents}</strong>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Admins</span>
          <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>{utilisateurs.admins}</strong>
        </div>
      </div>
      
      <Link href="/admin/utilisateur" className="link-button" style={{ marginTop: '16px', justifyContent: 'center' }}>
        Gérer les accès <ArrowRight size={14} />
      </Link>
    </section>
  );
}
