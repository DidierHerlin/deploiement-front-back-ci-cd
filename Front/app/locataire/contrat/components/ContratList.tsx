'use client'

import React from 'react';
import { Contrat } from '@/lib/api';
import { Building2, FileText } from 'lucide-react';
import { ContratStatusBadge } from './ContratStatusBadge';

interface ContratListProps {
  contrats: Contrat[];
  onViewDetails: (contrat: Contrat) => void;
}

export function ContratList({ contrats, onViewDetails }: ContratListProps) {
  if (!contrats || contrats.length === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Aucun contrat trouvé.</p>
      </div>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Mes contrats de location</h2>
          <p>Liste de tous vos contrats et baux</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>BIEN</th>
              <th>TYPE</th>
              <th>DATE DE DÉBUT</th>
              <th>LOYER</th>
              <th>STATUT</th>
              <th>ACTIONS</th>
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
                <td>{contrat.bien_type || 'Non spécifié'}</td>
                <td>{contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString('fr-FR') : '-'}</td>
                <td><strong>{contrat.loyer ? `${parseFloat(contrat.loyer as string).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : '-'}</strong></td>
                <td>
                  <ContratStatusBadge status={contrat.statut} />
                </td>
                <td>
                  <button className="link-button" onClick={() => onViewDetails(contrat)} style={{ padding: 0 }}>
                    <FileText size={14} /> Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
