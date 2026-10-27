import { UserRound, X } from 'lucide-react'
import { UserProfil } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type UserModalProps = {
  user: UserProfil
  onClose: () => void
  onEdit: () => void
}

export function UserModal({ user, onClose, onEdit }: UserModalProps) {
  const { t } = useTranslation()

  const formatRole = (r: string) => {
    switch (r) {
      case 'ADMIN': return t("dashboard.roles.ADMIN", 'Admin')
      case 'AGENT': return t("dashboard.roles.AGENT", 'Agent')
      case 'PROPRIETAIRE': return t("dashboard.roles.PROPRIETAIRE", 'Propriétaire')
      case 'LOCATAIRE': return t("dashboard.roles.LOCATAIRE", 'Locataire')
      default: return r
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section 
        className="w-full max-w-[460px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="view-title"
      >
        <button 
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer" 
          onClick={onClose} 
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>
        
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/20">
          <UserRound size={20} />
        </div>

        <h2 id="view-title" className="text-xl font-bold text-slate-900 dark:text-white m-0">
          {t("admin.users.user_details_title", "Détails de l'utilisateur")}
        </h2>

        <div className="mt-5 flex flex-col gap-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.full_name", "Nom complet :")}</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium text-right">{user.prenoms} {user.nom}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.email", "Email :")}</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium text-right">{user.email}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.phone", "Téléphone :")}</span>
            <span className={`font-medium text-right ${user.telephone ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 italic'}`}>
              {user.telephone || t("profile.not_provided", 'Non renseigné')}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.role", "Rôle :")}</span>
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {formatRole(user.role)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("forms.status", "Statut :")}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              user.is_active
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {user.is_active ? t("dashboard.common.active", 'Actif') : t("dashboard.common.inactive", 'Inactif')}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.registered_on", "Date d'inscription :")}</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium text-right">{new Date(user.date_creation).toLocaleString('fr-FR')}</span>
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
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer" 
            onClick={onEdit}
          >
            {t("forms.edit", "Modifier")}
          </button>
        </div>
      </section>
    </div>
  )
}
