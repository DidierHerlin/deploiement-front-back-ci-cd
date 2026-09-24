import React from 'react';
import { Building2, FileText, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Contrat } from '@/lib/api';

interface DashboardContratCardProps {
  contrat: Contrat | null;
  loading: boolean;
  error: string | null;
}

export function DashboardContratCard({ contrat, loading, error }: DashboardContratCardProps) {
  if (loading) {
    return (
      <section className="panel contract-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Loader2 className="animate-spin" size={24} color="var(--text-secondary)" />
      </section>
    );
  }

  if (error || !contrat) {
    return (
      <section className="panel contract-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px', gap: '1rem' }}>
        <AlertCircle size={32} color="var(--text-secondary)" />
        <p style={{ color: 'var(--text-secondary)' }}>{error || "Aucun contrat de location actif trouvé."}</p>
      </section>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <section className="panel contract-panel">
      <div className="panel-header">
        <div>
          <h2>Mon contrat en cours</h2>
          <p>Contrat #{contrat.id} — Créé le {formatDate(contrat.date_creation)}</p>
        </div>
        <span className="status paid"><i />{contrat.statut}</span>
      </div>
      <div className="property-card">
        <div className="property-image"><Building2 size={27} /></div>
        <div>
          <strong>{contrat.bien_titre}</strong>
          <p>{contrat.bien_type}</p>
          <span>Loyer mensuel : {parseFloat(contrat.loyer || '0').toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar</span>
        </div>
      </div>
      <div className="contract-details">
        <div><span>Date de début</span><strong>{formatDate(contrat.date_debut)}</strong></div>
        {contrat.date_fin && (
          <div><span>Échéance du bail</span><strong>{formatDate(contrat.date_fin)}</strong></div>
        )}
      </div>
      <div className="panel-actions">
        <button className="outline-button" onClick={() => window.location.href = '/locataire/contrat'}>
          <FileText size={15} />Voir tous mes contrats
        </button>
      </div>
    </section>
  );
}
