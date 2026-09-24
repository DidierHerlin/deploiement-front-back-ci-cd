import { Plus } from 'lucide-react'

type UserPageHeaderProps = {
  onCreateClick: () => void
}

export function UserPageHeader({ onCreateClick }: UserPageHeaderProps) {
  return (
    <div className="welcome-row" style={{ marginBottom: '20px' }}>
      <div>
        <h1>Gestion des <span>Utilisateurs</span></h1>
        <p className="subtitle">Supervisez les accès, attribuez les rôles et modifiez les informations.</p>
      </div>
      <button className="primary-button" onClick={onCreateClick}>
        <Plus size={16} /> Créer un utilisateur
      </button>
    </div>
  )
}
