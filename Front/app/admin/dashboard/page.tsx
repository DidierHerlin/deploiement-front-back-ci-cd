'use client'

import React from 'react';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { BiensStats } from './components/BiensStats';
import { ContratsStats } from './components/ContratsStats';
import { PaiementsStats } from './components/PaiementsStats';
import { UtilisateursStats } from './components/UtilisateursStats';
import { RecentActivities } from './components/RecentActivities';
import { DashboardCharts } from './components/DashboardCharts';
import { LoadingState, ErrorState } from './components/States';

export default function DashboardPage() {
  const { data, loading, error } = useAdminDashboard();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState error={error || "Données indisponibles."} onRetry={() => window.location.reload()} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="welcome-row" style={{ marginBottom: '10px' }}>
        <div>
          <p className="eyebrow">DASHBOARD ADMINISTRATEUR</p>
          <h1>Vue d'ensemble de la plateforme</h1>
          <p className="subtitle">Statistiques en temps réel et suivi d'activité de votre agence.</p>
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
