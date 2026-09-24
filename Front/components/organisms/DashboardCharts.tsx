import React from 'react';
import { AdminDashboardData } from '../hooks/useAdminDashboard';

export function DashboardCharts({ data }: { data: AdminDashboardData }) {
  const { biens } = data;

  const stats = {
    dispo: biens.filter(b => b.statut === 'DISPONIBLE').length,
    loue: biens.filter(b => b.statut === 'LOUE').length,
    vendu: biens.filter(b => b.statut === 'VENDU').length,
    travaux: biens.filter(b => b.statut === 'EN_TRAVAUX').length,
  };
  
  const total = biens.length;
  
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
          {stats.dispo > 0 && <i style={{ width: `${getPercentage(stats.dispo)}%`, background: 'var(--green)' }} title={`Disponible: ${stats.dispo}`} />}
          {stats.loue > 0 && <i style={{ width: `${getPercentage(stats.loue)}%`, background: 'var(--primary)' }} title={`Loué: ${stats.loue}`} />}
          {stats.vendu > 0 && <i style={{ width: `${getPercentage(stats.vendu)}%`, background: '#64748b' }} title={`Vendu: ${stats.vendu}`} />}
          {stats.travaux > 0 && <i style={{ width: `${getPercentage(stats.travaux)}%`, background: 'var(--orange)' }} title={`En travaux: ${stats.travaux}`} />}
        </div>
      ) : (
        <div style={{ height: '9px', background: '#eef0f4', borderRadius: '8px', margin: '24px 0' }} />
      )}

      <div className="legend" style={{ display: 'flex', gap: '24px' }}>
        <div><i style={{ background: 'var(--green)' }} /><span>Disponibles</span><strong>{getPercentage(stats.dispo).toFixed(0)}%</strong></div>
        <div><i style={{ background: 'var(--primary)' }} /><span>Loués</span><strong>{getPercentage(stats.loue).toFixed(0)}%</strong></div>
        <div><i style={{ background: '#64748b' }} /><span>Vendus</span><strong>{getPercentage(stats.vendu).toFixed(0)}%</strong></div>
        <div><i style={{ background: 'var(--orange)' }} /><span>En travaux</span><strong>{getPercentage(stats.travaux).toFixed(0)}%</strong></div>
      </div>
    </section>
  );
}
