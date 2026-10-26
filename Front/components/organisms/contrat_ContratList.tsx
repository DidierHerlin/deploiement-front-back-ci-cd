'use client'

import React from 'react';
import { Contrat } from '@/lib/api';
import { Building2, FileText } from 'lucide-react';
import { ContratStatusBadge } from "@/components/atoms/ContratStatusBadge";
import { useTranslation } from '@/lib/i18n';

interface ContratListProps {
  contrats: Contrat[];
  onViewDetails?: (contrat: Contrat) => void;
}

export function ContratList({ contrats, onViewDetails }: ContratListProps) {
  const { t } = useTranslation();

  if (!contrats || contrats.length === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>{t("proprietaire_pages.contrats.empty", "Aucun contrat trouvé.")}</p>
      </div>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{t("locataire_pages.contrat.list_title", "Mes contrats de location")}</h2>
          <p>{t("locataire_pages.contrat.list_sub", "Liste de tous vos contrats et baux")}</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("admin.contrats.col_property", "BIEN")}</th>
              <th>{t("admin.contrats.col_type", "TYPE")}</th>
              <th>{t("admin.contrats.col_start_date", "DATE DE DÉBUT")}</th>
              <th>{t("locataire_pages.contrat.card_rent", "LOYER")}</th>
              <th>{t("admin.contrats.col_status", "STATUT")}</th>
              <th>{t("admin.contrats.col_actions", "ACTIONS")}</th>
            </tr>
          </thead>
          <tbody>
            {contrats.map((contrat) => (
              <tr key={contrat.id}>
                <td>
                  <div className="property" style={{ gap: '12px', alignItems: 'center' }}>
                    <div className="property-icon bg-primary" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                      <Building2 size={14} />
                    </div>
                    <div className="property-info">
                      <strong style={{ fontSize: '12px' }}>{contrat.bien_titre}</strong>
                    </div>
                  </div>
                </td>
                <td>{contrat.bien_type || t("dashboard.common.not_specified", 'Non spécifié')}</td>
                <td>{contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString('fr-FR') : '-'}</td>
                <td><strong>{contrat.loyer ? `${parseFloat(contrat.loyer as string).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : '-'}</strong></td>
                <td>
                  <ContratStatusBadge status={contrat.statut} />
                </td>
                <td>
                  {onViewDetails ? (
                    <button className="link-button" onClick={() => onViewDetails(contrat)} style={{ padding: 0 }}>
                      <FileText size={14} /> {t("forms.view", "Voir")}
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#9aa3b0' }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
