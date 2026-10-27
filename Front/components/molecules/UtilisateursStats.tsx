import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export function UtilisateursStats({ data }: { data: AdminDashboardData }) {
  const { t } = useTranslation();
  const { utilisateurs } = data;
  
  return (
    <section className="panel flex flex-col">
      <div className="panel-header mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("dashboard.admin.community_title", "Communauté")}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("dashboard.admin.community_sub", "Répartition des utilisateurs")}</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg font-bold text-xs bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:border dark:border-blue-500/30">
          {utilisateurs.total} {t("dashboard.admin.registered_users", "inscrits")}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2.5 mt-auto">
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.roles.PROPRIETAIRE", "Propriétaires")}</span>
          <strong className="text-base font-bold text-slate-900 dark:text-white">{utilisateurs.proprietaires}</strong>
        </div>
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.roles.LOCATAIRE", "Locataires")}</span>
          <strong className="text-base font-bold text-slate-900 dark:text-white">{utilisateurs.locataires}</strong>
        </div>
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.roles.AGENT", "Agents")}</span>
          <strong className="text-base font-bold text-slate-900 dark:text-white">{utilisateurs.agents}</strong>
        </div>
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.roles.ADMIN", "Admins")}</span>
          <strong className="text-base font-bold text-slate-900 dark:text-white">{utilisateurs.admins}</strong>
        </div>
      </div>
      
      <Link href="/admin/utilisateur" className="link-button mt-4 justify-center text-blue-600 dark:text-blue-400 hover:underline">
        {t("dashboard.admin.manage_access", "Gérer les accès")} <ArrowRight size={14} />
      </Link>
    </section>
  );
}
