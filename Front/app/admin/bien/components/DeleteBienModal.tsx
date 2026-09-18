import { Trash2 } from 'lucide-react'

type DeleteBienModalProps = {
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteBienModal({ onCancel, onConfirm }: DeleteBienModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
        <div className="modal-icon warning"><Trash2 size={20} /></div>
        <h2 id="deactivate-title">Supprimer ce bien ?</h2>
        <p>La suppression est définitive. Les contrats ou paiements associés pourraient être affectés.</p>
        <div className="modal-actions">
          <button className="outline-button" onClick={onCancel}>Annuler</button>
          <button className="danger-button" onClick={onConfirm}>Supprimer</button>
        </div>
      </section>
    </div>
  )
}
