import { Plus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type UserPageHeaderProps = {
  onCreateClick: () => void
}

export function UserPageHeader({ onCreateClick }: UserPageHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="welcome-row" style={{ marginBottom: '20px' }}>
      <div>
        <h1>{t("admin.users.title_start", "Gestion des")} <span>{t("admin.users.title_highlight", "Utilisateurs")}</span></h1>
        <p className="subtitle">{t("admin.users.subtitle", "Supervisez les accès, attribuez les rôles et modifiez les informations.")}</p>
      </div>
      <button className="primary-button" onClick={onCreateClick}>
        <Plus size={16} /> {t("admin.users.add_user", "Créer un utilisateur")}
      </button>
    </div>
  )
}
