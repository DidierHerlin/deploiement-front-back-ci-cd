import { UserX } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type DeleteConfirmModalProps = {
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({ onCancel, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useTranslation()
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
        <div className="modal-icon warning"><UserX size={20} /></div>
        <h2 id="deactivate-title">{t("admin.users.confirm_delete_title", "Supprimer ce compte ?")}</h2>
        <p>{t("admin.users.confirm_delete_desc", "La suppression est définitive et toutes les données associées seront supprimées du système.")}</p>
        <div className="modal-actions">
          <button className="outline-button" onClick={onCancel}>{t("forms.cancel", "Annuler")}</button>
          <button className="danger-button" onClick={onConfirm}>{t("forms.delete", "Supprimer")}</button>
        </div>
      </section>
    </div>
  )
}
