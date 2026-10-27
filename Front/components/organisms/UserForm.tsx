import { UserRound, LockKeyhole, X } from 'lucide-react'
import { UserProfil } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type UserFormProps = {
  editingUser: UserProfil | null
  newUser: any
  setNewUser: (user: any) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function UserForm({ editingUser, newUser, setNewUser, onClose, onSubmit }: UserFormProps) {
  const { t } = useTranslation()

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
        aria-labelledby="modal-title"
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
        <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white m-0">
          {editingUser ? t("admin.users.edit_title", 'Modifier l’utilisateur') : t("admin.users.create_title", 'Créer un utilisateur')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {editingUser ? t("admin.users.edit_sub", 'Mettez à jour les informations du compte.') : t("admin.users.create_sub", 'Un seul rôle actif pourra être attribué à ce compte.')}
        </p>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <div className="flex gap-2.5">
            <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("profile.last_name", "Nom")}
              <input 
                required 
                value={newUser.nom} 
                onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })} 
                placeholder="Ex. Dupont" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("profile.first_name", "Prénoms")}
              <input 
                required 
                value={newUser.prenoms} 
                onChange={(e) => setNewUser({ ...newUser, prenoms: e.target.value })} 
                placeholder="Ex. Jeanne" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>
          <div className="flex gap-2.5">
            <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("profile.email", "Adresse email")}
              <input 
                required 
                type="email" 
                value={newUser.email} 
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} 
                placeholder="jeanne@email.fr" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("profile.phone", "Téléphone")}
              <input 
                type="text" 
                value={newUser.telephone} 
                onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })} 
                placeholder="034 00 000 00" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
            {t("profile.role", "Rôle")}
            <select 
              value={newUser.role} 
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Admin">{t("dashboard.roles.ADMIN", "Admin")}</option>
              <option value="Agent">{t("dashboard.roles.AGENT", "Agent")}</option>
              <option value="Propriétaire">{t("dashboard.roles.PROPRIETAIRE", "Propriétaire")}</option>
              <option value="Locataire">{t("dashboard.roles.LOCATAIRE", "Locataire")}</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
            <span>{t("auth.password_label", "Mot de passe")} {editingUser && <span className="font-normal text-[10px] text-slate-500 dark:text-slate-400">({t("admin.users.leave_empty_pwd", "Laisser vide pour ne pas modifier")})</span>}</span>
            <input 
              type={editingUser ? "password" : "text"} 
              value={newUser.password} 
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} 
              placeholder={editingUser ? "********" : t("admin.users.create_pwd_placeholder", "Créer un mot de passe")} 
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          
          {!editingUser && (
            <div className="flex gap-2 items-start p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] leading-relaxed border border-blue-200 dark:border-blue-800/40">
              <LockKeyhole size={15} className="shrink-0 mt-0.5" />
              <span>{t("admin.users.pwd_security_note", "Le mot de passe sera haché. Il doit contenir au moins 8 caractères, une majuscule et un chiffre.")}</span>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
            <button 
              type="button" 
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
              onClick={onClose}
            >
              {t("forms.cancel", "Annuler")}
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer" 
              type="submit"
            >
              {editingUser ? t("forms.save", 'Enregistrer') : t("admin.users.create_account_btn", 'Créer le compte')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
