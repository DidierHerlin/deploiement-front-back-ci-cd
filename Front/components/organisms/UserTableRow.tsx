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
          <span className={`user-initial ${user.role === 'ADMIN' ? 'orange' : user.role === 'AGENT' ? 'purple' : user.role === 'LOCATAIRE' ? 'green' : 'blue'}`}>
            {getInitials(user)}
          </span>
          <div>
            <strong>{user.prenoms} {user.nom}</strong>
            <small>{user.email}</small>
          </div>
        </div>
      </td>
      <td>
        {user.telephone ? (
          <span style={{ color: '#586577', fontSize: '11px' }}>{user.telephone}</span>
        ) : (
          <span style={{ color: '#a0a8b5', fontSize: '11px', fontStyle: 'italic' }}>{t("profile.not_provided", "Non renseigné")}</span>
        )}
      </td>
      <td>
        <span className="role-badge">{formatRole(user.role)}</span>
      </td>
      <td>
        <span className={`status ${user.is_active ? 'paid' : 'disabled'}`}>
          <i />{user.is_active ? t("dashboard.common.active", 'Actif') : t("dashboard.common.inactive", 'Inactif')}
        </span>
      </td>
      <td>{new Date(user.date_creation).toLocaleDateString('fr-FR')}</td>
      <td>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button aria-label={t("forms.view", "Voir")} onClick={() => onView(user)} title={t("forms.view", "Voir détails")}>
            <Eye size={15} />
          </button>
          <button aria-label={t("forms.edit", "Modifier")} onClick={() => onEdit(user)} title={t("forms.edit", "Modifier")}>
            <Pencil size={15} />
          </button>
          <button aria-label={t("admin.users.toggle_status", "Activer/Désactiver")} onClick={() => onToggleStatus(user)} title={user.is_active ? t("admin.users.deactivate", "Désactiver") : t("admin.users.activate", "Activer")}>
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
