import { UserMinus } from 'lucide-react'
import { Locataire } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type DisableLocataireModalProps = {
  locataire: Locataire
  onCancel: () => void
  onConfirm: () => void
}

export function DisableLocataireModal({ locataire, onCancel, onConfirm }: DisableLocataireModalProps) {
  const { t } = useTranslation()
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <section 
        className="w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="disable-title"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border dark:border-rose-500/20">
          <UserMinus size={20} />
        </div>
        
        <h2 id="disable-title" className="text-xl font-bold text-slate-900 dark:text-white m-0">
          {t("admin.locataires.confirm_disable_title", "Désactiver ce compte ?")}
        </h2>
        
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
          {t("admin.locataires.confirm_disable_prompt", "Êtes-vous sûr de vouloir désactiver le compte de")}{' '}
          <strong className="text-slate-900 dark:text-white font-semibold">
            {locataire.user?.prenoms} {locataire.user?.nom}
          </strong> ?
        </p>
        
        <p className="mt-3 p-3 rounded-lg text-xs bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
          {t("admin.locataires.confirm_disable_desc", "Le locataire ne pourra plus se connecter, mais son historique de paiement et de bail sera conservé.")}
        </p>
        
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button 
            type="button" 
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
            onClick={onCancel}
          >
            {t("forms.cancel", "Annuler")}
          </button>
          <button 
            type="button" 
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer" 
            onClick={onConfirm}
          >
            {t("admin.users.deactivate", "Désactiver")}
          </button>
        </div>
      </section>
    </div>
  )
}
