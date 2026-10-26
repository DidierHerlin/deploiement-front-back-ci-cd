import { SlidersHorizontal } from 'lucide-react'
import { Proprietaire } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type BienFiltersProps = {
  typeFilter: string
  setTypeFilter: (val: string) => void
  statutFilter: string
  setStatutFilter: (val: string) => void
  operationFilter: string
  setOperationFilter: (val: string) => void
  proprietaireFilter: string
  setProprietaireFilter: (val: string) => void
  proprietaires: Proprietaire[]
}

export function BienFilters({ 
  typeFilter, setTypeFilter, 
  statutFilter, setStatutFilter, 
  operationFilter, setOperationFilter,
  proprietaireFilter, setProprietaireFilter,
  proprietaires
}: BienFiltersProps) {
  const { t } = useTranslation()

  return (
    <>
      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label={t("admin.biens.filter_all_types", "Filtrer par type")}>
        <option value="Tous">{t("admin.biens.filter_all_types", "Tous les types")}</option>
        <option value="APPARTEMENT">{t("types.apartment", "Appartement")}</option>
        <option value="MAISON">{t("types.house", "Maison")}</option>
        <option value="LOCAL_COMMERCIAL">{t("types.commercial", "Local commercial")}</option>
        <option value="TERRAIN">{t("types.land", "Terrain")}</option>
      </select>
      
      <select value={operationFilter} onChange={(e) => setOperationFilter(e.target.value)} aria-label={t("admin.biens.filter_all_ops", "Filtrer par opération")}>
        <option value="Toutes">{t("admin.biens.filter_all_ops", "Toutes les opérations")}</option>
        <option value="LOCATION">{t("card.for_rent", "Location")}</option>
        <option value="VENTE">{t("card.for_sale", "Vente")}</option>
      </select>
      
      <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} aria-label={t("admin.biens.filter_all_status", "Filtrer par statut")}>
        <option value="Tous">{t("admin.biens.filter_all_status", "Tous les statuts")}</option>
        <option value="DISPONIBLE">{t("dashboard.common.status_disponible", "Disponible")}</option>
        <option value="RESERVE">{t("dashboard.common.status_reserve", "Réservé")}</option>
        <option value="LOUE">{t("dashboard.common.status_loue", "Loué")}</option>
        <option value="VENDU">{t("dashboard.common.status_vendu", "Vendu")}</option>
        <option value="EN_TRAVAUX">{t("dashboard.common.status_en_travaux", "En travaux")}</option>
      </select>
      
      <select value={proprietaireFilter} onChange={(e) => setProprietaireFilter(e.target.value)} aria-label={t("admin.biens.filter_all_owners", "Filtrer par propriétaire")}>
        <option value="Tous">{t("admin.biens.filter_all_owners", "Tous les propriétaires")}</option>
        {proprietaires.map(p => (
          <option key={p.id} value={p.id.toString()}>{p.user.prenoms} {p.user.nom}</option>
        ))}
      </select>

      <button className="filter-button"><SlidersHorizontal size={15} />{t("forms.filter", "Filtres")}</button>
    </>
  )
}
