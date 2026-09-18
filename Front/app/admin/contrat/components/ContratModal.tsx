import { useState } from 'react'
import { X, FileText, Calendar, Building2, User, CreditCard } from 'lucide-react'
import { Contrat, Paiement } from '@/lib/api'
import { Pagination } from '@/components/ui/pagination'

type ContratModalProps = {
  contrat: Contrat
  paiements: Paiement[]
  onClose: () => void
  onAction: (action: 'resilier' | 'terminer' | 'finaliser_vente') => void
}

export function ContratModal({ contrat, paiements, onClose, onAction }: ContratModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(paiements.length / ITEMS_PER_PAGE);
  const paginatedData = paiements.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  const formatCurrency = (val: any) => {
    if (val === null || val === undefined) return '-'
    return `${Number(val).toLocaleString('fr-FR')} Ar`
  }
  
  const formatDate = (d: string) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  const isLocation = contrat.type_contrat === 'LOCATION'

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" style={{ width: '90vw', maxWidth: '1300px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer" style={{ top: '20px', right: '20px' }}><X size={18} /></button>
        
        <div style={{ flexShrink: 0 }}>
          <div className="modal-icon"><FileText size={20} /></div>
          <h2 style={{ marginBottom: '5px' }}>Détails du contrat #{contrat.id}</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Statut actuel : <span style={{ fontWeight: 600 }}>{contrat.statut}</span> • Créé le {formatDate(contrat.date_creation)}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>

        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
            <h3 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
              <Building2 size={14} /> Bien concerné
            </h3>
            <p style={{ fontWeight: 500 }}>{contrat.bien_titre}</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Type : {contrat.bien_type}</p>
          </div>

          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
            <h3 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
              <User size={14} /> Locataire / Acheteur
            </h3>
            <p style={{ fontWeight: 500 }}>{contrat.locataire_prenoms} {contrat.locataire_nom}</p>
          </div>

          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', gridColumn: isLocation ? '1 / 2' : '1 / -1' }}>
            <h3 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
              <CreditCard size={14} /> Conditions Financières
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {isLocation ? (
                <>
                  <div><small style={{ color: '#666' }}>Loyer mensuel</small><br /><strong>{formatCurrency(contrat.loyer)}</strong></div>
                  <div><small style={{ color: '#666' }}>Dépôt de garantie</small><br /><strong>{formatCurrency(contrat.depot_garantie)}</strong></div>
                </>
              ) : (
                <>
                  <div><small style={{ color: '#666' }}>Prix de vente</small><br /><strong>{formatCurrency(contrat.prix)}</strong></div>
                  <div><small style={{ color: '#666' }}>Modalité</small><br /><strong>{contrat.type_paiement_achat}</strong></div>
                </>
              )}
            </div>
          </div>

          {isLocation && (
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                <Calendar size={14} /> Période
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><small style={{ color: '#666' }}>Date de début</small><br /><strong>{formatDate(contrat.date_debut)}</strong></div>
                <div><small style={{ color: '#666' }}>Date de fin</small><br /><strong>{formatDate(contrat.date_fin)}</strong></div>
              </div>
            </div>
          )}

        </div>

        <h3 style={{ fontSize: '15px', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
          Échéancier & Paiements
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>MONTANT</th>
                <th>STATUT</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? paginatedData.map(p => (
                <tr key={p.id}>
                  <td>{formatDate(p.date_paiement_prevue || p.date_echeance)}</td>
                  <td><strong>{formatCurrency(p.montant_attendu || p.montant)}</strong></td>
                  <td><span className="role-badge">{p.statut}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Aucun paiement associé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>

        <div className="modal-actions" style={{ flexShrink: 0, marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {contrat.statut === 'ACTIF' && isLocation && (
              <>
                <button className="danger-button" onClick={() => onAction('resilier')}>Résilier</button>
                <button className="primary-button" onClick={() => onAction('terminer')}>Terminer le bail</button>
              </>
            )}
            {(contrat.statut === 'ACTIF' || contrat.statut === 'RESERVE') && !isLocation && (
              <button className="primary-button" onClick={() => onAction('finaliser_vente')}>Finaliser Vente</button>
            )}
          </div>
          <button className="outline-button" onClick={onClose}>Fermer</button>
        </div>
      </section>
    </div>
  )
}
