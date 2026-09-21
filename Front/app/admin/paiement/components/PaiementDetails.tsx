import { X, CreditCard, Download, AlertTriangle } from 'lucide-react'
import { Paiement, downloadQuittance } from '@/lib/api'
import { PaiementStatusBadge } from './PaiementStatusBadge'

type PaiementDetailsProps = {
  paiement: Paiement
  onClose: () => void
}

export function PaiementDetails({ paiement, onClose }: PaiementDetailsProps) {
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
  const formatMontant = (m: string | null) => m ? Number(m).toLocaleString('fr-FR') + ' Ar' : '-'

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" style={{ width: '90vw', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer" style={{ top: '20px', right: '20px' }}><X size={18} /></button>
        
        <div style={{ flexShrink: 0 }}>
          <div className="modal-icon"><CreditCard size={20} /></div>
          <h2 style={{ marginBottom: '5px' }}>Détails du paiement #{paiement.id}</h2>
          <p style={{ marginBottom: '20px', color: '#64748b' }}>Créé le {formatDate(paiement.date_creation)}</p>
          
          {paiement.est_en_retard && (
            <div style={{ padding: '10px 15px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <AlertTriangle size={18} />
              <span>{paiement.statut === 'PAYE' ? "Ce paiement a été réglé en retard par rapport à la date d'échéance." : "Ce paiement est en retard par rapport à la date d'échéance."}</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            
            {/* Infos générales */}
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Informations générales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div><small style={{ color: '#64748b' }}>Statut</small><div><PaiementStatusBadge statut={paiement.statut} /></div></div>
                <div><small style={{ color: '#64748b' }}>Échéance N°</small><div style={{ fontWeight: 500 }}>{paiement.num_echeance || '-'}</div></div>
                <div><small style={{ color: '#64748b' }}>Période</small><div style={{ fontWeight: 500 }}>{paiement.message_mois || '-'}</div></div>
                <div><small style={{ color: '#64748b' }}>Mode de paiement</small><div style={{ fontWeight: 500 }}>{paiement.mode_paiement || '-'}</div></div>
                <div><small style={{ color: '#64748b' }}>Référence</small><div style={{ fontWeight: 500 }}>{paiement.reference || '-'}</div></div>
              </div>
            </div>

            {/* Finances */}
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Finances</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div><small style={{ color: '#64748b' }}>Montant attendu</small><div style={{ fontWeight: 500 }}>{formatMontant(paiement.montant_attendu)}</div></div>
                <div><small style={{ color: '#64748b' }}>Montant versé</small><div style={{ fontWeight: 500, color: '#10b981' }}>{formatMontant(paiement.montant_paye)}</div></div>
                {paiement.est_partiel && (
                  <div><small style={{ color: '#64748b' }}>Montant restant</small><div style={{ fontWeight: 500, color: '#dc2626' }}>{formatMontant(paiement.montant_restant)}</div></div>
                )}
                <div style={{ marginTop: '10px' }}><small style={{ color: '#64748b' }}>Part Propriétaire</small><div style={{ fontWeight: 500 }}>{formatMontant(paiement.part_proprietaire?.toString() || null)}</div></div>
                <div><small style={{ color: '#64748b' }}>Commission Agence</small><div style={{ fontWeight: 500 }}>{formatMontant(paiement.commission_agent?.toString() || null)}</div></div>
              </div>
            </div>

            {/* Dates */}
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Dates</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div><small style={{ color: '#64748b' }}>Date d'échéance</small><div style={{ fontWeight: 500 }}>{formatDate(paiement.date_echeance)}</div></div>
                <div><small style={{ color: '#64748b' }}>Date de paiement prévue</small><div style={{ fontWeight: 500 }}>{formatDate(paiement.date_paiement_prevue)}</div></div>
                <div><small style={{ color: '#64748b' }}>Date de paiement effective</small><div style={{ fontWeight: 500 }}>{formatDate(paiement.date_paiement)}</div></div>
                <div><small style={{ color: '#64748b' }}>Date versement partiel</small><div style={{ fontWeight: 500 }}>{formatDate(paiement.date_versement_partiel)}</div></div>
              </div>
            </div>

            {/* Contrat & Bien */}
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Contrat & Parties</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div><small style={{ color: '#64748b' }}>Contrat N°</small><div style={{ fontWeight: 500 }}>{paiement.contrat}</div></div>
                <div><small style={{ color: '#64748b' }}>Bien immobilier</small><div style={{ fontWeight: 500 }}>{paiement.bien_titre}</div></div>
                <div><small style={{ color: '#64748b' }}>Locataire / Acheteur</small><div style={{ fontWeight: 500 }}>{paiement.locataire_nom}</div></div>
                <div><small style={{ color: '#64748b' }}>Loyer du contrat</small><div style={{ fontWeight: 500 }}>{formatMontant(paiement.loyer_contrat)}</div></div>
              </div>
            </div>

          </div>
        </div>

        <div className="modal-actions" style={{ flexShrink: 0, marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
          <div>
            {paiement.statut === 'PAYE' && (
              <button className="outline-button" onClick={() => downloadQuittance(paiement.id)} style={{ color: '#2563eb', borderColor: '#2563eb' }}>
                <Download size={16} /> Télécharger la quittance
              </button>
            )}
          </div>
          <button className="outline-button" onClick={onClose}>Fermer</button>
        </div>
      </section>
    </div>
  )
}
