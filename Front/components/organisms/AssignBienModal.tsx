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
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section 
        className="w-full max-w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto" 
        role="dialog" 
        aria-modal="true"
      >
        <button 
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer" 
          onClick={onClose} 
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>
        
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/20">
          <Link2 size={20} />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">
          {t("admin.proprietaires.assign_title", "Associer un bien (Transfert)")}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {t("admin.proprietaires.assign_desc", "Un bien immobilier appartient à un seul propriétaire. L'association transfèrera la propriété si le bien appartient déjà à quelqu'un d'autre.")}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
            <span>{t("admin.proprietaires.assign_select", "Sélectionner un bien")}</span>
            <select 
              required 
              value={selectedBienId} 
              onChange={e => setSelectedBienId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{t("admin.proprietaires.select_property", "-- Choisir un bien --")}</option>
              {availableBiens.map(b => (
                <option key={b.id} value={b.id}>
                  {b.titre} ({t("admin.proprietaires.current_owner", "Propriétaire actuel")} : {b.proprietaire?.user?.prenoms} {b.proprietaire?.user?.nom})
                </option>
              ))}
            </select>
          </label>

          {selectedBien && selectedBien.proprietaire && (
            <div className="mt-1 p-3 rounded-lg text-xs bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
              {t("admin.proprietaires.transfer_warning", "Attention : Ce bien appartient déjà à un propriétaire. En validant, il sera transféré.")}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button 
              type="button" 
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
              onClick={onClose}
            >
              {t("forms.cancel", "Annuler")}
            </button>
            <button 
              type="submit" 
              disabled={loading || !selectedBienId} 
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? t("forms.saving", "Association...") : t("admin.proprietaires.assign_confirm_btn", "Associer à ce propriétaire")}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
