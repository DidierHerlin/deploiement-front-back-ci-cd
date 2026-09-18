import { X, UserRound, Building2 } from 'lucide-react'
import { Proprietaire } from '@/lib/api'

type ProprietaireModalProps = {
  proprietaire: Proprietaire
  onClose: () => void
  onManageBiens: () => void
}

export function ProprietaireModal({ proprietaire, onClose, onManageBiens }: ProprietaireModalProps) {
  const user = proprietaire.user
  const isActive = user?.is_active ?? true

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        <div className="modal-icon"><UserRound size={20} /></div>
        <h2 id="detail-title">Fiche Propriétaire</h2>
        
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
          <div>
            <small style={{ color: '#586577' }}>Nom et prénoms</small>
            <p style={{ fontWeight: 500 }}>{user?.prenoms} {user?.nom}</p>
          </div>
          <div>
            <small style={{ color: '#586577' }}>Email</small>
            <p style={{ fontWeight: 500 }}>{user?.email}</p>
          </div>
          <div>
            <small style={{ color: '#586577' }}>Téléphone</small>
            <p style={{ fontWeight: 500 }}>{user?.telephone || 'Non renseigné'}</p>
          </div>
          <div>
            <small style={{ color: '#586577' }}>Statut du compte</small>
            <p style={{ fontWeight: 500 }}>
              {isActive ? <span style={{ color: '#16a34a' }}>Actif</span> : <span style={{ color: '#dc2626' }}>Désactivé</span>}
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1', padding: '10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#586577', display: 'block', marginBottom: '5px' }}>Informations financières</small>
            <p style={{ fontWeight: 500, fontSize: '13px' }}>IBAN (Reversements): {proprietaire.iban}</p>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '30px' }}>
          <button className="outline-button" onClick={onClose}>Fermer</button>
          <button className="primary-button" onClick={onManageBiens}><Building2 size={15} /> Gérer ses biens</button>
        </div>
      </section>
    </div>
  )
}
