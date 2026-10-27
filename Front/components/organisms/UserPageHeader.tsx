import { Plus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type UserPageHeaderProps = {
  onCreateClick: () => void
}

export function UserPageHeader({ onCreateClick }: UserPageHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="welcome-row mb-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          {t("admin.users.title_start", "Gestion des")}{' '}
          <span className="font-semibold text-slate-700 dark:text-white">{t("admin.users.title_highlight", "Utilisateurs")}</span>
        </h1>
        <p className="subtitle text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t("admin.users.subtitle", "Supervisez les accès, attribuez les rôles et modifiez les informations.")}
        </p>
      </div>
      <button className="primary-button" onClick={onCreateClick}>
        <Plus size={16} /> {t("admin.users.add_user", "Créer un utilisateur")}
      </button>
    </div>
  )
}
