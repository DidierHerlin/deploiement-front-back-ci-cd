import { UserMinus } from 'lucide-react'
import { Locataire } from '@/lib/api'

type DisableLocataireModalProps = {
  locataire: Locataire
  onCancel: () => void
  onConfirm: () => void
}

export function DisableLocataireModal({ locataire, onCancel, onConfirm }: DisableLocataireModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="disable-title">
        <div className="modal-icon warning"><UserMinus size={20} /></div>
        <h2 id="disable-title">Désactiver ce compte ?</h2>
        <p>Êtes-vous sûr de vouloir désactiver le compte de <strong>{locataire.user?.prenoms} {locataire.user?.nom}</strong> ?</p>
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#666', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          Le locataire ne pourra plus se connecter, mais ses données historiques (contrats, paiements) seront conservées.
        </p>
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="outline-button" onClick={onCancel}>Annuler</button>
          <button className="danger-button" onClick={onConfirm}>Désactiver</button>
        </div>
      </section>
    </div>
  )
}
