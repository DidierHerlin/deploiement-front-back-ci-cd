import { UserX } from 'lucide-react'

type DeleteConfirmModalProps = {
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({ onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
        <div className="modal-icon warning"><UserX size={20} /></div>
        <h2 id="deactivate-title">Supprimer ce compte ?</h2>
        <p>La suppression est définitive et toutes les données associées seront supprimées du système.</p>
        <div className="modal-actions">
          <button className="outline-button" onClick={onCancel}>Annuler</button>
          <button className="danger-button" onClick={onConfirm}>Supprimer</button>
        </div>
      </section>
    </div>
  )
}
