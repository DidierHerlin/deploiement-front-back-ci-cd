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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <section 
        className="w-full max-w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="deactivate-title"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border dark:border-rose-500/20">
          <Trash2 size={20} />
        </div>
        <h2 id="deactivate-title" className="text-lg font-bold text-slate-900 dark:text-white m-0">
          {t("admin.biens.confirm_delete_title", "Supprimer ce bien ?")}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
          {t("admin.biens.confirm_delete_desc", "La suppression est définitive. Les contrats ou paiements associés pourraient être affectés.")}
        </p>
        <div className="flex justify-end gap-2.5">
          <button 
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
            onClick={onCancel}
          >
            {t("forms.cancel", "Annuler")}
          </button>
          <button 
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer" 
            onClick={onConfirm}
          >
            {t("forms.delete", "Supprimer")}
          </button>
        </div>
      </section>
    </div>
  )
}
