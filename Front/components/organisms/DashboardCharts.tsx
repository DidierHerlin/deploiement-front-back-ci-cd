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
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t("dashboard.admin.distribution_title", "Répartition du parc")}</span>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span className="distribution-number text-slate-900 dark:text-white">{total}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("dashboard.admin.managed_properties", "biens gérés")}</span>
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
        <div className="h-[9px] bg-slate-100 dark:bg-slate-800 rounded-lg my-6" />
      )}

      <div className="legend flex flex-wrap gap-6">
        <div className="flex items-center">
          <i style={{ background: 'var(--green)' }} />
          <span className="text-slate-600 dark:text-slate-400">{t("dashboard.common.status_disponible", "Disponibles")}</span>
          <strong className="text-slate-900 dark:text-slate-200 font-semibold ml-1">{getPercentage(biens.dispo).toFixed(0)}%</strong>
        </div>
        <div className="flex items-center">
          <i style={{ background: 'var(--primary)' }} />
          <span className="text-slate-600 dark:text-slate-400">{t("dashboard.common.status_loue", "Loués")}</span>
          <strong className="text-slate-900 dark:text-slate-200 font-semibold ml-1">{getPercentage(biens.loue).toFixed(0)}%</strong>
        </div>
        <div className="flex items-center">
          <i style={{ background: '#64748b' }} />
          <span className="text-slate-600 dark:text-slate-400">{t("dashboard.common.status_vendu", "Vendus")}</span>
          <strong className="text-slate-900 dark:text-slate-200 font-semibold ml-1">{getPercentage(biens.vendu).toFixed(0)}%</strong>
        </div>
        <div className="flex items-center">
          <i style={{ background: 'var(--orange)' }} />
          <span className="text-slate-600 dark:text-slate-400">{t("dashboard.common.status_en_travaux", "En travaux")}</span>
          <strong className="text-slate-900 dark:text-slate-200 font-semibold ml-1">{getPercentage(biens.travaux).toFixed(0)}%</strong>
        </div>
      </div>
    </section>
  );
}
