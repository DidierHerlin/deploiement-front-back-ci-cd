import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface BiensStatsProps {
  data: AdminDashboardData;
}

export function BiensStats({ data }: BiensStatsProps) {
  const { t } = useTranslation();
  const { biens } = data;
  
  return (
    <section className="panel flex flex-col">
      <div className="panel-header mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("dashboard.admin.property_portfolio", "Parc Immobilier")}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("dashboard.admin.portfolio_overview", "Vue d'ensemble de vos biens")}</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg font-bold text-xs bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:border dark:border-blue-500/30">
          {biens.total} {t("dashboard.admin.total_properties", "biens au total")}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2.5 mt-auto">
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-950/40">
          <strong className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">{biens.dispo}</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.common.status_disponible", "Disponibles")}</span>
        </div>
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-950/40">
          <strong className="block text-lg font-bold text-blue-600 dark:text-blue-400">{biens.loue}</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.common.status_loue", "Loués")}</span>
        </div>
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-950/40">
          <strong className="block text-lg font-bold text-slate-600 dark:text-slate-300">{biens.vendu}</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.common.status_vendu", "Vendus")}</span>
        </div>
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-950/40">
          <strong className="block text-lg font-bold text-amber-600 dark:text-amber-400">{biens.travaux}</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.common.status_en_travaux", "En travaux")}</span>
        </div>
      </div>
      
      <Link href="/admin/bien" className="link-button mt-4 justify-center text-blue-600 dark:text-blue-400 hover:underline">
        {t("dashboard.admin.manage_properties", "Gérer les biens")} <ArrowRight size={14} />
      </Link>
    </section>
  );
}
