import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type ProprietaireFiltersProps = {
  statutFilter: string
  setStatutFilter: (val: string) => void
}

export function ProprietaireFilters({ statutFilter, setStatutFilter }: ProprietaireFiltersProps) {
  const { t } = useTranslation()
  return (
    <>
      <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} aria-label={t("admin.proprietaires.filter_all_status", "Filtrer par statut")}>
        <option value="Tous">{t("admin.proprietaires.filter_all_status", "Tous les statuts")}</option>
        <option value="Actif">{t("dashboard.common.active", "Actif")}</option>
        <option value="Désactivé">{t("dashboard.common.inactive", "Désactivé")}</option>
      </select>
      <button className="filter-button"><SlidersHorizontal size={15} />{t("forms.filter", "Filtres")}</button>
    </>
  )
}
