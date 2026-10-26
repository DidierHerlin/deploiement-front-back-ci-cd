'use client'

import { Trash2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type DeleteBienModalProps = {
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteBienModal({ onCancel, onConfirm }: DeleteBienModalProps) {
  const { t } = useTranslation()
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
        <div className="modal-icon warning"><Trash2 size={20} /></div>
        <h2 id="deactivate-title">{t("admin.biens.confirm_delete_title", "Supprimer ce bien ?")}</h2>
        <p>{t("admin.biens.confirm_delete_desc", "La suppression est définitive. Les contrats ou paiements associés pourraient être affectés.")}</p>
        <div className="modal-actions">
          <button className="outline-button" onClick={onCancel}>{t("forms.cancel", "Annuler")}</button>
          <button className="danger-button" onClick={onConfirm}>{t("forms.delete", "Supprimer")}</button>
        </div>
      </section>
    </div>
  )
}
