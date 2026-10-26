import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type LocataireFiltersProps = {
  statutFilter: string
  setStatutFilter: (val: string) => void
}

export function LocataireFilters({ statutFilter, setStatutFilter }: LocataireFiltersProps) {
  const { t } = useTranslation()
  return (
    <>
      <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} aria-label={t("admin.locataires.filter_all_status", "Filtrer par statut")}>
        <option value="Tous">{t("admin.locataires.filter_all_status", "Tous les statuts")}</option>
        <option value="Actif">{t("dashboard.common.active", "Actif")}</option>
        <option value="Désactivé">{t("dashboard.common.inactive", "Désactivé")}</option>
      </select>
      <button className="filter-button"><SlidersHorizontal size={15} />{t("forms.filter", "Filtres")}</button>
    </>
  )
}
