import { X, UserRound, Building2 } from 'lucide-react'
import { Proprietaire } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type ProprietaireModalProps = {
  proprietaire: Proprietaire
  onClose: () => void
  onManageBiens: () => void
}

export function ProprietaireModal({ proprietaire, onClose, onManageBiens }: ProprietaireModalProps) {
  const { t } = useTranslation()
  const user = proprietaire.user
  const isActive = user?.is_active ?? true
  const iban = proprietaire.iban || (proprietaire as any).rib || (proprietaire as any).contact_paiement

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section 
        className="w-full max-w-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="detail-title"
      >
        <button 
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer" 
          onClick={onClose} 
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>
        
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/20">
          <UserRound size={20} />
        </div>

        <h2 id="detail-title" className="text-xl font-bold text-slate-900 dark:text-white m-0">
          {t("admin.proprietaires.sheet_title", "Fiche Propriétaire")}
        </h2>
        
        <div className="mt-5 flex flex-col gap-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.full_name", "Nom complet :")}</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium text-right">{user?.prenoms} {user?.nom}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.email", "Email :")}</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium text-right">{user?.email}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.phone", "Téléphone :")}</span>
            <span className={`font-medium text-right ${user?.telephone ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 italic'}`}>
              {user?.telephone || t("profile.not_provided", 'Non renseigné')}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("admin.proprietaires.account_status", "Statut du compte :")}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isActive ? t("dashboard.common.active", "Actif") : t("dashboard.common.inactive", "Désactivé")}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 mt-1">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block mb-1">
              {t("admin.proprietaires.financial_info", "Informations financières")}
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 m-0">
              <span className="text-slate-500 dark:text-slate-400">{t("profile.iban", "IBAN (Reversements)")} : </span>
              {iban ? (
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{iban}</span>
              ) : (
                <span className="italic text-slate-400 dark:text-slate-500">{t("profile.iban_not_provided", "IBAN non renseigné")}</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button 
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
            onClick={onClose}
          >
            {t("forms.close", "Fermer")}
          </button>
          <button 
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5" 
            onClick={onManageBiens}
          >
            <Building2 size={15} /> {t("admin.proprietaires.manage_properties_btn", "Gérer ses biens")}
          </button>
        </div>
      </section>
    </div>
  )
}
