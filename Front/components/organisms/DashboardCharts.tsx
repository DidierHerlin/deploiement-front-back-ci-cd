import React from 'react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';

export function DashboardCharts({ data }: { data: AdminDashboardData }) {
  const { biens } = data;

  const total = biens.total;
  const getPercentage = (val: number) => total > 0 ? (val / total) * 100 : 0;

  return (
    <section className="panel distribution" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px' }}>
        <div>
          <span style={{ color: '#8993a3', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Répartition du parc</span>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span className="distribution-number">{total}</span>
            <span>biens gérés</span>
          </div>
        </div>
      </div>
      
      {total > 0 ? (
        <div className="distribution-bar" style={{ marginTop: '24px' }}>
          {biens.dispo > 0 && <i style={{ width: `${getPercentage(biens.dispo)}%`, background: 'var(--green)' }} title={`Disponible: ${biens.dispo}`} />}
          {biens.loue > 0 && <i style={{ width: `${getPercentage(biens.loue)}%`, background: 'var(--primary)' }} title={`Loué: ${biens.loue}`} />}
          {biens.vendu > 0 && <i style={{ width: `${getPercentage(biens.vendu)}%`, background: '#64748b' }} title={`Vendu: ${biens.vendu}`} />}
          {biens.travaux > 0 && <i style={{ width: `${getPercentage(biens.travaux)}%`, background: 'var(--orange)' }} title={`En travaux: ${biens.travaux}`} />}
        </div>
      ) : (
        <div style={{ height: '9px', background: '#eef0f4', borderRadius: '8px', margin: '24px 0' }} />
      )}

      <div className="legend" style={{ display: 'flex', gap: '24px' }}>
        <div><i style={{ background: 'var(--green)' }} /><span>Disponibles</span><strong>{getPercentage(biens.dispo).toFixed(0)}%</strong></div>
        <div><i style={{ background: 'var(--primary)' }} /><span>Loués</span><strong>{getPercentage(biens.loue).toFixed(0)}%</strong></div>
        <div><i style={{ background: '#64748b' }} /><span>Vendus</span><strong>{getPercentage(biens.vendu).toFixed(0)}%</strong></div>
        <div><i style={{ background: 'var(--orange)' }} /><span>En travaux</span><strong>{getPercentage(biens.travaux).toFixed(0)}%</strong></div>
      </div>
    </section>
  );
}
