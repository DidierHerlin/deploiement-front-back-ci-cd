import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export function ContratsStats({ data }: { data: AdminDashboardData }) {
  const { t } = useTranslation();
  const { contrats } = data;
  
  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>{t("dashboard.admin.contracts_title", "Contrats")}</h2>
          <p>{t("dashboard.admin.contracts_sub", "Suivi des baux et ventes")}</p>
        </div>
        <div style={{ padding: '8px 12px', background: '#eaf8f3', color: 'var(--green)', borderRadius: '8px', fontWeight: 'bold' }}>
          {contrats.actifs} {t("dashboard.common.active", "actifs")}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: 'auto' }}>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px' }}>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t("card.for_rent", "Location")}</span>
          <strong style={{ fontSize: '18px', color: 'var(--navy)' }}>{contrats.locations}</strong>
        </div>
        <div style={{ padding: '12px', border: '1px solid #eef0f4', borderRadius: '8px' }}>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t("card.for_sale", "Vente")}</span>
          <strong style={{ fontSize: '18px', color: 'var(--navy)' }}>{contrats.ventes}</strong>
        </div>
      </div>
      
      {contrats.expiring > 0 && (
        <div style={{ marginTop: '12px', padding: '10px', background: '#fff7e8', color: 'var(--orange)', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} />
          <strong>{contrats.expiring} {t("dashboard.admin.expiring_contracts_notice", "contrat(s) arrivent à échéance ce mois-ci.")}</strong>
        </div>
      )}
      
      <Link href="/admin/contrat" className="link-button" style={{ marginTop: '16px', justifyContent: 'center' }}>
        {t("dashboard.admin.manage_contracts", "Gérer les contrats")} <ArrowRight size={14} />
      </Link>
    </section>
  );
}
