import React from 'react';
import { X, FileText, UserRound, Building2, CircleDollarSign } from 'lucide-react';
import { Contrat } from '@/lib/api';
import { ContratStatusBadge } from './ContratStatusBadge';
import { ContratDownloadButton } from './ContratDownloadButton';

interface ContratDetailsProps {
  contrat: Contrat;
  onClose: () => void;
}

export function ContratDetails({ contrat, onClose }: ContratDetailsProps) {
  const isLocation = contrat.type_contrat === 'LOCATION';
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant: any) => {
    return montant ? `${parseFloat(montant).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : 'N/A';
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="details-title" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        <div style={{ padding: '26px 26px 15px', position: 'relative', borderBottom: '1px solid #f0f1f4', flexShrink: 0 }}>
          <button className="modal-close" onClick={onClose} aria-label="Fermer" style={{ top: '26px', right: '26px' }}>
            <X size={18} />
          </button>
          <div className="modal-icon">
            <FileText size={20} />
          </div>
          <h2 id="details-title" style={{ marginBottom: 0 }}>Détails du contrat #{contrat.id}</h2>
        </div>
        
        <div style={{ padding: '20px 26px', overflowY: 'auto', flex: 1 }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16}/> Informations contractuelles
          </h3>
          <div className="profile-fields" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div><span>Référence</span><strong>#{contrat.id}</strong></div>
            <div><span>Type</span><strong>{isLocation ? 'Location' : 'Achat'}</strong></div>
            <div><span>Statut</span><ContratStatusBadge statut={contrat.statut} /></div>
            <div><span>Date de début</span><strong>{formatDate(contrat.date_debut)}</strong></div>
            {isLocation && <div><span>Date de fin</span><strong>{formatDate(contrat.date_fin)}</strong></div>}
          </div>

          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={16}/> Bien concerné
          </h3>
          <div className="profile-fields" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}><span>Titre</span><strong>{contrat.bien_titre}</strong></div>
            <div><span>Type</span><strong>{contrat.bien_type}</strong></div>
            <div><span>Adresse</span><strong>Selon dossier du bien</strong></div>
          </div>

          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CircleDollarSign size={16}/> Informations financières
          </h3>
          <div className="profile-fields" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {isLocation ? (
              <>
                <div><span>Loyer mensuel</span><strong>{formatMontant(contrat.loyer)}</strong></div>
                <div><span>Dépôt de garantie</span><strong>{formatMontant(contrat.depot_garantie)}</strong></div>
              </>
            ) : (
              <div><span>Prix de vente</span><strong>{formatMontant(contrat.prix)}</strong></div>
            )}
          </div>

          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserRound size={16}/> Parties concernées
          </h3>
          <div className="profile-fields" style={{ gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div><span>Locataire</span><strong>{contrat.locataire_prenoms} {contrat.locataire_nom}</strong></div>
          </div>
        </div>
        
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 26px 26px', borderTop: '1px solid #f0f1f4', flexShrink: 0, marginTop: 0 }}>
          <ContratDownloadButton contratId={contrat.id} typeContrat={contrat.type_contrat} />
          <button className="primary-button" onClick={onClose}>Fermer</button>
        </div>
      </section>
    </div>
  );
}
