'use client'

import { useState } from 'react'
import { Bien, deleteBien } from '@/lib/api'
import { X, Trash2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface DeleteBienModalProps {
  bien: Bien
  onClose: (refresh?: boolean) => void
}

export function DeleteBienModal({ bien, onClose }: DeleteBienModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      await deleteBien(bien.id)
      onClose(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || t("forms.error", "Erreur lors de la suppression du bien."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop bg-black/60 backdrop-blur-xs">
      <div className="modal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button className="modal-close text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" onClick={() => onClose()}><X size={20} /></button>
        <div className="modal-icon !bg-red-50 dark:!bg-red-950/40 !text-red-600 dark:!text-red-400 mb-4 flex items-center justify-center rounded-full w-12 h-12">
          <Trash2 size={24} />
        </div>
        <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">{t("admin.biens.confirm_delete_title", "Supprimer ce bien ?")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {t("proprietaire_pages.biens.confirm_delete_msg", "Êtes-vous sûr de vouloir supprimer le bien")} <strong className="text-slate-900 dark:text-white">{bien.titre}</strong> ? {t("proprietaire_pages.biens.confirm_delete_extra", "Cette action est irréversible et toutes les données associées seront perdues.")}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-2">
          <button 
            type="button" 
            onClick={() => onClose()} 
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {t("forms.cancel", "Annuler")}
          </button>
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={loading} 
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            {loading ? t("forms.loading", "Suppression...") : t("forms.delete", "Oui, supprimer")}
          </button>
        </div>
      </div>
    </div>
  )
}
