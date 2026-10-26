'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowUpRight } from 'lucide-react'
import { useAgentDashboard } from './hooks/useAgentDashboard'

import { OccupationStats } from "@/components/molecules/OccupationStats"
import { RevenusStats } from "@/components/molecules/RevenusStats"
import { ImpayesStats } from "@/components/molecules/ImpayesStats"
import { DisponibiliteStats } from "@/components/molecules/DisponibiliteStats"
import EstatePanel from "@/components/organisms/EstatePanel"
import { RevenueChart } from "@/components/organisms/reporting_RevenueChart"
import ArrearsList from "@/components/organisms/ArrearsList"
import ContractsList from "@/components/organisms/ContractsList"
import PendingBanner from "@/components/molecules/PendingBanner"
import DashboardFooter from "@/components/organisms/DashboardFooter"
import { LoadingState, ErrorState } from "@/components/organisms/States"
import { useTranslation } from '@/lib/i18n'

export default function AgentDashboardPage() {
  const { t } = useTranslation();
  const { data, loading, error } = useAgentDashboard();
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error || t("dashboard.common.error_occurred", "Données indisponibles.")} onRetry={() => window.location.reload()} />;

  return (
    <>
      <div className="agent-head">
        <div>
          <p className="eyebrow">{t("dashboard.agent.eyebrow", "DASHBOARD AGENT")}</p>
          <h1>{t("dashboard.agent.title_main", "Tableau de bord")} <span>{t("dashboard.agent.title_highlight", "de gestion.")}</span></h1>
          <p className="subtitle">{t("dashboard.agent.subtitle", "Suivi de la performance locative et gestion au quotidien.")}</p>
        </div>
        <div className="agent-head-actions">
          <Link className="agent-btn agent-btn-ghost" href="/agent/biens">
            {t("dashboard.agent.view_properties", "Voir les biens")} <ArrowUpRight size={15} />
          </Link>
          <Link className="agent-btn agent-btn-primary" href="/agent/contrats/ajouter">
            {t("dashboard.agent.new_contract", "Nouveau contrat")}
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <OccupationStats data={data} />
        <RevenusStats data={data} />
        <ImpayesStats data={data} />
        <DisponibiliteStats data={data} />
      </div>

      <div className="admin-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
          <EstatePanel data={data} />
          <RevenueChart chartData={data.revenus.chartData} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
          <ArrearsList data={data} onToast={showToast} />
          <ContractsList data={data} />
        </div>
      </div>

      <PendingBanner />

      <DashboardFooter />

      {toast && <div className="agent-toast"><Check size={16} /> {toast}</div>}
    </>
  )
}
