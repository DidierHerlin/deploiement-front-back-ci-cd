'use client'

import React from 'react';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { BiensStats } from "@/components/molecules/BiensStats";
import { ContratsStats } from "@/components/molecules/ContratsStats";
import { PaiementsStats } from "@/components/molecules/PaiementsStats";
import { UtilisateursStats } from "@/components/molecules/UtilisateursStats";
import { RecentActivities } from "@/components/organisms/RecentActivities";
import { DashboardCharts } from "@/components/organisms/DashboardCharts";
import { LoadingState, ErrorState } from "@/components/organisms/States";
import { useTranslation } from '@/lib/i18n';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data, loading, error } = useAdminDashboard();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState error={error || t("dashboard.common.error_occurred", "Données indisponibles.")} onRetry={() => window.location.reload()} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="welcome-row" style={{ marginBottom: '10px' }}>
        <div>
          <p className="eyebrow">{t("dashboard.admin.eyebrow", "DASHBOARD ADMINISTRATEUR")}</p>
          <h1>{t("dashboard.admin.title", "Vue d'ensemble de la plateforme")}</h1>
          <p className="subtitle">{t("dashboard.admin.subtitle", "Statistiques en temps réel et suivi d'activité de votre agence.")}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        <BiensStats data={data} />
        <ContratsStats data={data} />
        <PaiementsStats data={data} />
        <UtilisateursStats data={data} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '18px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <DashboardCharts data={data} />
        </div>
        <div>
          <RecentActivities data={data} />
        </div>
      </div>
    </div>
  );
}
