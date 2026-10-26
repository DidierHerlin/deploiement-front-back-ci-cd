import React from 'react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import { useTranslation } from '@/lib/i18n';

export function DashboardCharts({ data }: { data: AdminDashboardData }) {
  const { t } = useTranslation();
  const { biens } = data;

  const total = biens.total;
  const getPercentage = (val: number) => total > 0 ? (val / total) * 100 : 0;

  return (
    <section className="panel distribution" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px' }}>
        <div>
          <span style={{ color: '#8993a3', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{t("dashboard.admin.distribution_title", "Répartition du parc")}</span>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span className="distribution-number">{total}</span>
            <span>{t("dashboard.admin.managed_properties", "biens gérés")}</span>
          </div>
        </div>
      </div>
      
      {total > 0 ? (
        <div className="distribution-bar" style={{ marginTop: '24px' }}>
          {biens.dispo > 0 && <i style={{ width: `${getPercentage(biens.dispo)}%`, background: 'var(--green)' }} title={`${t("dashboard.common.status_disponible", "Disponible")}: ${biens.dispo}`} />}
          {biens.loue > 0 && <i style={{ width: `${getPercentage(biens.loue)}%`, background: 'var(--primary)' }} title={`${t("dashboard.common.status_loue", "Loué")}: ${biens.loue}`} />}
          {biens.vendu > 0 && <i style={{ width: `${getPercentage(biens.vendu)}%`, background: '#64748b' }} title={`${t("dashboard.common.status_vendu", "Vendu")}: ${biens.vendu}`} />}
          {biens.travaux > 0 && <i style={{ width: `${getPercentage(biens.travaux)}%`, background: 'var(--orange)' }} title={`${t("dashboard.common.status_en_travaux", "En travaux")}: ${biens.travaux}`} />}
        </div>
      ) : (
        <div style={{ height: '9px', background: '#eef0f4', borderRadius: '8px', margin: '24px 0' }} />
      )}

      <div className="legend" style={{ display: 'flex', gap: '24px' }}>
        <div><i style={{ background: 'var(--green)' }} /><span>{t("dashboard.common.status_disponible", "Disponibles")}</span><strong>{getPercentage(biens.dispo).toFixed(0)}%</strong></div>
        <div><i style={{ background: 'var(--primary)' }} /><span>{t("dashboard.common.status_loue", "Loués")}</span><strong>{getPercentage(biens.loue).toFixed(0)}%</strong></div>
        <div><i style={{ background: '#64748b' }} /><span>{t("dashboard.common.status_vendu", "Vendus")}</span><strong>{getPercentage(biens.vendu).toFixed(0)}%</strong></div>
        <div><i style={{ background: 'var(--orange)' }} /><span>{t("dashboard.common.status_en_travaux", "En travaux")}</span><strong>{getPercentage(biens.travaux).toFixed(0)}%</strong></div>
      </div>
    </section>
  );
}
