import { Plus, ShieldCheck } from 'lucide-react'

type DashboardHeaderProps = {
  activeUsersCount: number
  onCreateUser: () => void
}

export function DashboardHeader({ activeUsersCount, onCreateUser }: DashboardHeaderProps) {
  return (
    <>
      <div className="welcome-row">
        <div>
          <h1>Bonjour Admin, <span>voici l’activité de la plateforme.</span></h1>
          <p className="subtitle">Supervisez les comptes, le parc immobilier et les opérations de gestion locative.</p>
        </div>
        <button className="primary-button" onClick={onCreateUser}>
          <Plus size={16} /> Créer un utilisateur
        </button>
      </div>
      
      <div className="admin-banner">
        <div className="banner-icon"><ShieldCheck size={19} /></div>
        <div>
          <strong>Plateforme opérationnelle</strong>
          <p>{activeUsersCount} utilisateurs actifs · Toutes les données historiques sont conservées conformément aux règles de gestion.</p>
        </div>
        <span className="system-status"><i /> Système actif</span>
      </div>
    </>
  )
}
