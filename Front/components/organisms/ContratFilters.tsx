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
      <select 
        value={typeFilter} 
        onChange={(e) => setTypeFilter(e.target.value)} 
        aria-label={t("admin.contrats.filter_all_types", "Filtrer par type")}
        className="rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 px-3 py-1.5 transition-colors"
      >
        <option value="Tous">{t("admin.contrats.filter_all_types", "Tous les contrats")}</option>
        <option value="LOCATION">{t("card.for_rent", "Location")}</option>
        <option value="ACHAT">{t("card.for_sale", "Achat")}</option>
      </select>
      
      <select 
        value={statutFilter} 
        onChange={(e) => setStatutFilter(e.target.value)} 
        aria-label={t("admin.contrats.filter_all_status", "Filtrer par statut")}
        className="rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 px-3 py-1.5 transition-colors"
      >
        <option value="Tous">{t("admin.contrats.filter_all_status", "Tous les statuts")}</option>
        <option value="RESERVE">{t("dashboard.common.status_reserve", "Réservé")}</option>
        <option value="ACTIF">{t("dashboard.common.active", "Actif")}</option>
        <option value="RESILIE">{t("dashboard.common.status_resilie", "Résilié")}</option>
        <option value="TERMINE">{t("dashboard.common.status_termine", "Terminé")}</option>
        <option value="VENDU">{t("dashboard.common.status_vendu", "Vendu")}</option>
      </select>

      <button className="filter-button flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 transition-colors">
        <SlidersHorizontal size={15} />
        {t("forms.filter", "Filtres")}
      </button>
    </>
  )
}
