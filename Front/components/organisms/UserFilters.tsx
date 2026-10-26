import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type UserFiltersProps = {
  roleFilter: string
  onRoleFilterChange: (val: string) => void
}

export function UserFilters({ roleFilter, onRoleFilterChange }: UserFiltersProps) {
  const { t } = useTranslation()
  return (
    <>
      <select 
        value={roleFilter} 
        onChange={(e) => onRoleFilterChange(e.target.value)} 
        aria-label={t("admin.users.filter_all_roles", "Filtrer par rôle")}
      >
        <option value="Tous les rôles">{t("admin.users.filter_all_roles", "Tous les rôles")}</option>
        <option value="Admin">{t("dashboard.roles.ADMIN", "Admin")}</option>
        <option value="Agent">{t("dashboard.roles.AGENT", "Agent")}</option>
        <option value="Propriétaire">{t("dashboard.roles.PROPRIETAIRE", "Propriétaire")}</option>
        <option value="Locataire">{t("dashboard.roles.LOCATAIRE", "Locataire")}</option>
      </select>
      <button className="filter-button">
        <SlidersHorizontal size={15} /> {t("forms.filter", "Filtres")}
      </button>
    </>
  )
}
