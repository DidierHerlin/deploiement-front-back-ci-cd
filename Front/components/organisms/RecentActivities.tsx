import React from 'react';
import { FileText, Wallet, Clock } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import { useTranslation } from '@/lib/i18n';

export function RecentActivities({ data }: { data: AdminDashboardData }) {
  const { t } = useTranslation();
  const { recentEvents } = data;
  
  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000); // secondes
    if (diff < 60) return t("dashboard.common.just_now", "À l'instant");
    if (diff < 3600) return `${t("dashboard.common.ago", "Il y a")} ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `${t("dashboard.common.ago", "Il y a")} ${Math.floor(diff/3600)} h`;
    return `${t("dashboard.common.ago", "Il y a")} ${Math.floor(diff/86400)} j`;
  };

  const getIcon = (iconName: string) => {
    if (iconName === 'FileText') return FileText;
    if (iconName === 'Wallet') return Wallet;
    return Clock;
  };

  return (
    <section className="panel flex flex-col">
      <div className="panel-header mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("dashboard.admin.recent_activity", "Activités récentes")}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("dashboard.admin.recent_activity_sub", "Derniers événements sur la plateforme")}</p>
        </div>
      </div>
      
      {(!recentEvents || recentEvents.length === 0) ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500">
          <Clock size={32} className="opacity-20 mx-auto mb-2.5" />
          <p className="text-xs">{t("dashboard.admin.no_recent_activity", "Aucune activité récente.")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {recentEvents.map(ev => {
            const Icon = getIcon(ev.icon);
            return (
              <div key={ev.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0 bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border dark:border-amber-500/20">
                  <Icon size={16} />
                </div>
                <div>
                  <strong className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">{ev.title}</strong>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 my-0.5">{ev.text}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{getTimeAgo(ev.date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
