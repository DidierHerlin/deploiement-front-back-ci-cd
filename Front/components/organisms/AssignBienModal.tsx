import { X, Link2 } from 'lucide-react'
import { Bien, Proprietaire } from '@/lib/api'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'

type AssignBienModalProps = {
  targetProprietaire: Proprietaire
  allBiens: Bien[]
  onClose: () => void
  onAssign: (bienId: number) => Promise<void>
}

export function AssignBienModal({ targetProprietaire, allBiens, onClose, onAssign }: AssignBienModalProps) {
  const { t } = useTranslation()
  const [selectedBienId, setSelectedBienId] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  
  // Exclure les biens qui appartiennent déjà à ce propriétaire
  const availableBiens = allBiens.filter(b => b.proprietaire?.id !== targetProprietaire.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBienId) return
    setLoading(true)
    try {
      await onAssign(Number(selectedBienId))
    } catch (e: any) {
      alert("Erreur lors de l'association: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedBien = availableBiens.find(b => b.id === Number(selectedBienId))

  return (
    <div className="modal-backdrop" role="presentation" style={{ zIndex: 1100 }}>
      <section className="modal" role="dialog" aria-modal="true" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose} aria-label={t("forms.close", "Fermer")}><X size={18} /></button>
        <div className="modal-icon"><Link2 size={20} /></div>
        <h2>{t("admin.proprietaires.assign_title", "Associer un bien (Transfert)")}</h2>
        <p>{t("admin.proprietaires.assign_desc", "Un bien immobilier appartient à un seul propriétaire. L'association transfèrera la propriété si le bien appartient déjà à quelqu'un d'autre.")}</p>

        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <label>{t("admin.proprietaires.assign_select", "Sélectionner un bien")}
            <select required value={selectedBienId} onChange={e => setSelectedBienId(e.target.value)}>
              <option value="">{t("admin.proprietaires.select_property", "-- Choisir un bien --")}</option>
              {availableBiens.map(b => (
                <option key={b.id} value={b.id}>
                  {b.titre} ({t("admin.proprietaires.current_owner", "Propriétaire actuel")} : {b.proprietaire?.user?.prenoms} {b.proprietaire?.user?.nom})
                </option>
              ))}
            </select>
          </label>

          {selectedBien && selectedBien.proprietaire && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#fef3c7', color: '#92400e', fontSize: '12px', borderRadius: '4px' }}>
              {t("admin.proprietaires.transfer_warning", "Attention : Ce bien appartient déjà à un propriétaire. En validant, il sera transféré.")}
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="outline-button" onClick={onClose}>{t("forms.cancel", "Annuler")}</button>
            <button type="submit" disabled={loading || !selectedBienId} className="primary-button">
              {loading ? t("forms.saving", "Association...") : t("admin.proprietaires.assign_confirm_btn", "Associer à ce propriétaire")}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
