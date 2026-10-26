import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type ContratFiltersProps = {
  typeFilter: string
  setTypeFilter: (val: string) => void
  statutFilter: string
  setStatutFilter: (val: string) => void
}

export function ContratFilters({ typeFilter, setTypeFilter, statutFilter, setStatutFilter }: ContratFiltersProps) {
  const { t } = useTranslation()

  return (
    <>
      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label={t("admin.contrats.filter_all_types", "Filtrer par type")}>
        <option value="Tous">{t("admin.contrats.filter_all_types", "Tous les types")}</option>
        <option value="LOCATION">{t("card.for_rent", "Location")}</option>
        <option value="ACHAT">{t("card.for_sale", "Achat")}</option>
      </select>
      
      <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} aria-label={t("admin.contrats.filter_all_status", "Filtrer par statut")}>
        <option value="Tous">{t("admin.contrats.filter_all_status", "Tous les statuts")}</option>
        <option value="RESERVE">{t("dashboard.common.status_reserve", "Réservé")}</option>
        <option value="ACTIF">{t("dashboard.common.active", "Actif")}</option>
        <option value="RESILIE">{t("dashboard.common.status_resilie", "Résilié")}</option>
        <option value="TERMINE">{t("dashboard.common.status_termine", "Terminé")}</option>
        <option value="VENDU">{t("dashboard.common.status_vendu", "Vendu")}</option>
      </select>

      <button className="filter-button"><SlidersHorizontal size={15} />{t("forms.filter", "Filtres")}</button>
    </>
  )
}
