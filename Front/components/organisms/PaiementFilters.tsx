import { Filter, X, Smartphone } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type PaiementFiltersProps = {
  statutFilter: string
  setStatutFilter: (s: string) => void
  modeFilter: string
  setModeFilter: (m: string) => void
  onlyMobileMoneyPending?: boolean
  setOnlyMobileMoneyPending?: (v: boolean) => void
  mobileMoneyPendingCount?: number
}

export function PaiementFilters({
  statutFilter,
  setStatutFilter,
  modeFilter,
  setModeFilter,
  onlyMobileMoneyPending,
  setOnlyMobileMoneyPending,
  mobileMoneyPendingCount,
}: PaiementFiltersProps) {
  const { t } = useTranslation()
  const isFiltered = statutFilter !== 'Tous' || modeFilter !== 'Tous' || !!onlyMobileMoneyPending

  const resetFilters = () => {
    setStatutFilter('Tous')
    setModeFilter('Tous')
    if (setOnlyMobileMoneyPending) setOnlyMobileMoneyPending(false)
  }

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Filter size={16} />
        <span className="text-sm font-medium">{t("forms.filter", "Filtres :")}</span>
      </div>

      {setOnlyMobileMoneyPending && (
        <button
          type="button"
          onClick={() => {
            const next = !onlyMobileMoneyPending;
            setOnlyMobileMoneyPending(next);
            if (next) {
              setStatutFilter('Tous');
              setModeFilter('Tous');
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
            onlyMobileMoneyPending
              ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-600 dark:border-emerald-500'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 dark:hover:bg-emerald-900/40'
          }`}
          title={t("admin.paiements.mobile_money_pending_filter_title", "Afficher uniquement les demandes Mobile Money soumises par les locataires en attente de validation")}
        >
          <Smartphone size={13} />
          <span>{t("admin.paiements.mobile_money_to_validate", "Mobile Money à valider")}</span>
          {mobileMoneyPendingCount !== undefined && (
            <span
              className={
                onlyMobileMoneyPending
                  ? "bg-white/25 text-white rounded-full px-1.5 py-0.2 text-[11px] font-bold min-w-4 text-center"
                  : "bg-emerald-600 dark:bg-emerald-500 text-white rounded-full px-1.5 py-0.2 text-[11px] font-bold min-w-4 text-center"
              }
            >
              {mobileMoneyPendingCount}
            </span>
          )}
        </button>
      )}

      <select 
        className="filter-select px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer" 
        value={onlyMobileMoneyPending ? 'EN_ATTENTE' : statutFilter} 
        onChange={(e) => {
          if (setOnlyMobileMoneyPending) setOnlyMobileMoneyPending(false);
          setStatutFilter(e.target.value);
        }}
      >
        <option value="Tous">{t("admin.paiements.filter_all_status", "Tous les statuts")}</option>
        <option value="EN_ATTENTE">{t("dashboard.common.status_en_attente", "En attente")}</option>
        <option value="PAYE">{t("dashboard.common.status_paye", "Payé")}</option>
        <option value="PARTIEL">{t("dashboard.common.status_partiel", "Partiel")}</option>
        <option value="EN_RETARD">{t("dashboard.common.status_en_retard", "En retard")}</option>
        <option value="ANNULE">{t("dashboard.common.status_annule", "Annulé")}</option>
      </select>

      <select 
        className="filter-select px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer" 
        value={onlyMobileMoneyPending ? 'Tous' : modeFilter} 
        onChange={(e) => {
          if (setOnlyMobileMoneyPending) setOnlyMobileMoneyPending(false);
          setModeFilter(e.target.value);
        }}
      >
        <option value="Tous">{t("admin.paiements.filter_all_modes", "Tous les modes")}</option>
        <option value="MVOLA">Mvola</option>
        <option value="ORANGE_MONEY">Orange Money</option>
        <option value="AIRTEL_MONEY">Airtel Money</option>
        <option value="VIREMENT">{t("admin.paiements.mode_virement", "Virement")}</option>
        <option value="CHEQUE">{t("admin.paiements.mode_cheque", "Chèque")}</option>
        <option value="ESPECE">{t("admin.paiements.mode_especes", "Espèce")}</option>
      </select>

      {isFiltered && (
        <button 
          onClick={resetFilters}
          className="inline-flex items-center gap-1 bg-transparent border-0 text-rose-600 dark:text-rose-400 text-xs font-semibold cursor-pointer px-2 py-1.5 hover:underline"
        >
          <X size={14} /> {t("forms.reset", "Réinitialiser")}
        </button>
      )}
    </div>
  )
}
