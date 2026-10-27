import { Eye, Pencil, UserX, CheckCircle2, X as CloseIcon } from 'lucide-react'
import { UserProfil } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type UserTableRowProps = {
  user: UserProfil
  onView: (user: UserProfil) => void
  onEdit: (user: UserProfil) => void
  onToggleStatus: (user: UserProfil) => void
  onDelete: (id: number) => void
}

export function UserTableRow({ user, onView, onEdit, onToggleStatus, onDelete }: UserTableRowProps) {
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
  
  const getInitials = (user: UserProfil) => {
    return `${(user.prenoms || 'X')[0]}${(user.nom || 'X')[0]}`.toUpperCase()
  }

  return (
    <tr>
      <td>
        <div className="tenant">
          <span className={`user-initial border border-transparent dark:border-slate-700/80 ${
            user.role === 'ADMIN' 
              ? 'orange dark:bg-amber-500/15 dark:text-amber-300' 
              : user.role === 'AGENT' 
              ? 'purple dark:bg-purple-500/15 dark:text-purple-300' 
              : user.role === 'LOCATAIRE' 
              ? 'green dark:bg-emerald-500/15 dark:text-emerald-300' 
              : 'blue dark:bg-blue-500/15 dark:text-blue-300'
          }`}>
            {getInitials(user)}
          </span>
          <div>
            <strong className="text-slate-900 dark:text-slate-100">{user.prenoms} {user.nom}</strong>
            <small className="text-slate-500 dark:text-slate-400">{user.email}</small>
          </div>
        </div>
      </td>
      <td>
        {user.telephone ? (
          <span className="text-[#586577] dark:text-slate-300 text-[11px] font-medium">{user.telephone}</span>
        ) : (
          <span className="text-[#a0a8b5] dark:text-slate-500 text-[11px] italic">{t("profile.not_provided", "Non renseigné")}</span>
        )}
      </td>
      <td>
        <span className="role-badge dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700/60">{formatRole(user.role)}</span>
      </td>
      <td>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
          user.is_active 
            ? 'bg-[#eaf8f3] text-[#159570] border-transparent dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30' 
            : 'bg-slate-100 text-[#a0a8b5] border-transparent dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700'
        }`}>
          <i className={`inline-block w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-[#159570] dark:bg-emerald-400' : 'bg-[#c3c9d2] dark:bg-slate-500'}`} />
          {user.is_active ? t("dashboard.common.active", 'Actif') : t("dashboard.common.inactive", 'Inactif')}
        </span>
      </td>
      <td className="text-slate-600 dark:text-slate-300">{new Date(user.date_creation).toLocaleDateString('fr-FR')}</td>
      <td>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label={t("forms.view", "Voir")} onClick={() => onView(user)} title={t("forms.view", "Voir détails")}>
            <Eye size={15} />
          </button>
          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label={t("forms.edit", "Modifier")} onClick={() => onEdit(user)} title={t("forms.edit", "Modifier")}>
            <Pencil size={15} />
          </button>
          <button className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400" aria-label={t("admin.users.toggle_status", "Activer/Désactiver")} onClick={() => onToggleStatus(user)} title={user.is_active ? t("admin.users.deactivate", "Désactiver") : t("admin.users.activate", "Activer")}>
            {user.is_active ? <UserX size={15} /> : <CheckCircle2 size={15} />}
          </button>
          <button aria-label={t("forms.delete", "Supprimer")} onClick={() => onDelete(user.id)} title={t("forms.delete", "Supprimer")} style={{ color: '#ef6a76' }}>
            <CloseIcon size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
