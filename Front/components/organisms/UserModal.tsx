import { UserRound, X } from 'lucide-react'
import { UserProfil } from '@/lib/api'

type UserModalProps = {
  user: UserProfil
  onClose: () => void
  onEdit: () => void
}

export function UserModal({ user, onClose, onEdit }: UserModalProps) {
  const formatRole = (r: string) => {
    const map: Record<string, string> = { 'ADMIN': 'Admin', 'AGENT': 'Agent', 'PROPRIETAIRE': 'Propriétaire', 'LOCATAIRE': 'Locataire' }
    return map[r] || r
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="view-title">
        <button className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        <div className="modal-icon"><UserRound size={20} /></div>
        <h2 id="view-title">Détails de l'utilisateur</h2>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '13px', color: '#394454' }}>
          <div><strong>Nom complet :</strong> {user.prenoms} {user.nom}</div>
          <div><strong>Email :</strong> {user.email}</div>
          <div><strong>Téléphone :</strong> {user.telephone || 'Non renseigné'}</div>
          <div><strong>Rôle :</strong> <span className="role-badge">{formatRole(user.role)}</span></div>
          <div><strong>Statut :</strong> <span className={`status ${user.is_active ? 'paid' : 'disabled'}`}><i />{user.is_active ? 'Actif' : 'Inactif'}</span></div>
          <div><strong>Date d'inscription :</strong> {new Date(user.date_creation).toLocaleString('fr-FR')}</div>
        </div>
        <div className="modal-actions" style={{ marginTop: '25px' }}>
          <button className="outline-button" onClick={onClose}>Fermer</button>
          <button className="primary-button" onClick={onEdit}>Modifier</button>
        </div>
      </section>
    </div>
  )
}
