import { Eye, Pencil, UserX, CheckCircle2, X as CloseIcon } from 'lucide-react'
import { UserProfil } from '@/lib/api'

type UserTableRowProps = {
  user: UserProfil
  onView: (user: UserProfil) => void
  onEdit: (user: UserProfil) => void
  onToggleStatus: (user: UserProfil) => void
  onDelete: (id: number) => void
}

export function UserTableRow({ user, onView, onEdit, onToggleStatus, onDelete }: UserTableRowProps) {
  const formatRole = (r: string) => {
    const map: Record<string, string> = { 'ADMIN': 'Admin', 'AGENT': 'Agent', 'PROPRIETAIRE': 'Propriétaire', 'LOCATAIRE': 'Locataire' }
    return map[r] || r
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
          <span style={{ color: '#a0a8b5', fontSize: '11px', fontStyle: 'italic' }}>Non renseigné</span>
        )}
      </td>
      <td>
        <span className="role-badge">{formatRole(user.role)}</span>
      </td>
      <td>
        <span className={`status ${user.is_active ? 'paid' : 'disabled'}`}>
          <i />{user.is_active ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td>{new Date(user.date_creation).toLocaleDateString('fr-FR')}</td>
      <td>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button aria-label="Voir" onClick={() => onView(user)} title="Voir détails">
            <Eye size={15} />
          </button>
          <button aria-label="Modifier" onClick={() => onEdit(user)} title="Modifier">
            <Pencil size={15} />
          </button>
          <button aria-label="Activer/Désactiver" onClick={() => onToggleStatus(user)} title={user.is_active ? "Désactiver" : "Activer"}>
            {user.is_active ? <UserX size={15} /> : <CheckCircle2 size={15} />}
          </button>
          <button aria-label="Supprimer" onClick={() => onDelete(user.id)} title="Supprimer" style={{ color: '#ef6a76' }}>
            <CloseIcon size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
