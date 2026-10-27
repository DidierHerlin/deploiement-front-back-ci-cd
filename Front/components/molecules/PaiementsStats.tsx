import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export function PaiementsStats({ data }: { data: AdminDashboardData }) {
  const { t } = useTranslation();
  const { paiements } = data;
  
  // Formatage "300 000 Ar"
  const formatMontant = (m: number) => `${m.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar`;

  return (
    <section className="panel flex flex-col">
      <div className="panel-header mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("dashboard.admin.finances_title", "Finances & Paiements")}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("dashboard.admin.finances_sub", "Revenus collectés et impayés")}</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
          {formatMontant(paiements.totalRevenus)} {t("dashboard.admin.collected", "perçus")}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2.5 mt-auto">
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-950/40">
          <strong className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">{paiements.valides}</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.common.status_valide", "Validés")}</span>
        </div>
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-950/40">
          <strong className="block text-lg font-bold text-amber-600 dark:text-amber-400">{paiements.enAttente}</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("dashboard.common.status_en_attente", "En attente")}</span>
        </div>
        <div className={`p-3 border rounded-lg text-center ${
          paiements.enRetard > 0 
            ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' 
            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
        }`}>
          <strong className={`block text-lg font-bold ${
            paiements.enRetard > 0 
              ? 'text-rose-600 dark:text-rose-400' 
              : 'text-slate-900 dark:text-white'
          }`}>{paiements.enRetard}</strong>
          <span className={`text-[11px] ${
            paiements.enRetard > 0 
              ? 'text-rose-600 dark:text-rose-400' 
              : 'text-slate-500 dark:text-slate-400'
          }`}>{t("dashboard.common.status_en_retard", "En retard")}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2.5">
        <div className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t("dashboard.admin.partial_payments", "Paiements partiels")}</span>
          <strong className="text-xs font-bold text-slate-900 dark:text-white block">{paiements.partiels}</strong>
        </div>
        <div className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">{t("dashboard.admin.pending_amount", "Montant en attente")}</span>
          <strong className="text-xs font-bold text-amber-600 dark:text-amber-400 block">{formatMontant(paiements.totalAttendu)}</strong>
        </div>
      </div>
      
      <Link href="/admin/paiement" className="link-button mt-4 justify-center text-blue-600 dark:text-blue-400 hover:underline">
        {t("dashboard.admin.manage_payments", "Gérer les paiements")} <ArrowRight size={14} />
      </Link>
    </section>
  );
}
