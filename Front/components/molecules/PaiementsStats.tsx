import React from 'react';
import { Wallet, ArrowRight } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import Link from 'next/link';

export function PaiementsStats({ data }: { data: AdminDashboardData }) {
  const { paiements } = data;
  
  // Formatage "300 000 Ar"
  const formatMontant = (m: number) => `${m.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar`;

  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Finances & Paiements</h2>
          <p>Revenus collectés et impayés</p>
        </div>
        <div style={{ padding: '8px 12px', background: '#eaf8f3', color: 'var(--green)', borderRadius: '8px', fontWeight: 'bold' }}>
          {formatMontant(paiements.totalRevenus)} perçus
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: 'auto' }}>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--green)' }}>{paiements.valides}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Validés</span>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: 'var(--orange)' }}>{paiements.enAttente}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>En attente</span>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px', textAlign: 'center', background: paiements.enRetard > 0 ? '#fff0f1' : 'transparent', borderColor: paiements.enRetard > 0 ? '#ffcdd2' : '#eef0f4' }}>
          <strong style={{ display: 'block', fontSize: '18px', color: paiements.enRetard > 0 ? 'var(--red)' : 'var(--navy)' }}>{paiements.enRetard}</strong>
          <span style={{ fontSize: '11px', color: paiements.enRetard > 0 ? 'var(--red)' : 'var(--text-secondary)' }}>En retard</span>
        </div>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1, padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Paiements partiels</span>
          <strong style={{ fontSize: '13px', color: 'var(--navy)' }}>{paiements.partiels}</strong>
        </div>
        <div style={{ flex: 1, padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Montant en attente</span>
          <strong style={{ fontSize: '13px', color: 'var(--orange)' }}>{formatMontant(paiements.totalAttendu)}</strong>
        </div>
      </div>
      
      <Link href="/admin/paiement" className="link-button" style={{ marginTop: '16px', justifyContent: 'center' }}>
        Suivi des encaissements <ArrowRight size={14} />
      </Link>
    </section>
  );
}
