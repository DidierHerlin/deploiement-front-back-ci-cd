import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export function ContratsStats({ data }: { data: AdminDashboardData }) {
  const { t } = useTranslation();
  const { contrats } = data;
  
  return (
    <section className="panel flex flex-col">
      <div className="panel-header mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("dashboard.admin.contracts_title", "Contrats")}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("dashboard.admin.contracts_sub", "Suivi des baux et ventes")}</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
          {contrats.actifs} {t("dashboard.common.active", "actifs")}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2.5 mt-auto">
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40">
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">{t("card.for_rent", "Location")}</span>
          <strong className="block text-lg font-bold text-slate-900 dark:text-white">{contrats.locations}</strong>
        </div>
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40">
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">{t("card.for_sale", "Vente")}</span>
          <strong className="block text-lg font-bold text-slate-900 dark:text-white">{contrats.ventes}</strong>
        </div>
      </div>
      
      {contrats.expiring > 0 && (
        <div className="mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border dark:border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
          <strong className="font-semibold">{contrats.expiring} {t("dashboard.admin.expiring_contracts_notice", "contrat(s) arrivent à échéance ce mois-ci.")}</strong>
        </div>
      )}
      
      <Link href="/admin/contrat" className="link-button mt-4 justify-center text-blue-600 dark:text-blue-400 hover:underline">
        {t("dashboard.admin.manage_contracts", "Gérer les contrats")} <ArrowRight size={14} />
      </Link>
    </section>
  );
}
