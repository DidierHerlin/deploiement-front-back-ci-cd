'use client'

import { useState } from 'react'
import { Bien, deleteBien } from '@/lib/api'
import { X, Trash2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export type DeleteBienModalProps = {
  bien?: Bien
  onClose?: (refresh?: boolean) => void
  onCancel?: () => void
  onConfirm?: () => void
}

export function DeleteBienModal({ bien, onClose, onCancel, onConfirm }: DeleteBienModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (onClose) {
      onClose(false)
    }
  }

  const handleDelete = async () => {
    if (onConfirm) {
      onConfirm()
      return
    }

    if (!bien) return

    setLoading(true)
    setError(null)
    try {
      await deleteBien(bien.id)
      if (onClose) onClose(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || t("forms.error", "Erreur lors de la suppression du bien."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <section 
        className="w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-bien-title"
      >
        <button 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" 
          onClick={handleCancel}
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
          <Trash2 size={24} />
        </div>

        <h2 id="delete-bien-title" className="text-lg font-bold text-slate-900 dark:text-white m-0">
          {t("admin.biens.confirm_delete_title", "Supprimer ce bien ?")}
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
          {bien ? (
            <>
              {t("proprietaire_pages.biens.confirm_delete_msg", "Êtes-vous sûr de vouloir supprimer le bien")}{" "}
              <strong className="text-slate-900 dark:text-white">{bien.titre}</strong> ?{" "}
              {t("proprietaire_pages.biens.confirm_delete_extra", "Cette action est irréversible et toutes les données associées seront perdues.")}
            </>
          ) : (
            t("admin.biens.confirm_delete_desc", "La suppression est définitive. Les contrats ou paiements associés pourraient être affectés.")
          )}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5">
          <button 
            type="button" 
            onClick={handleCancel} 
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {t("forms.cancel", "Annuler")}
          </button>
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            {loading ? t("forms.loading", "Suppression...") : t("forms.delete", "Oui, supprimer")}
          </button>
        </div>
      </section>
    </div>
  )
}
export default DeleteBienModal
