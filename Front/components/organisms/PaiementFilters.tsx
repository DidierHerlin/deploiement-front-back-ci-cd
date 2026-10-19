import { Filter, X, Smartphone } from 'lucide-react'

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
  const isFiltered = statutFilter !== 'Tous' || modeFilter !== 'Tous' || !!onlyMobileMoneyPending

  const resetFilters = () => {
    setStatutFilter('Tous')
    setModeFilter('Tous')
    if (setOnlyMobileMoneyPending) setOnlyMobileMoneyPending(false)
  }

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
        <Filter size={16} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Filtres :</span>
      </div>

      {setOnlyMobileMoneyPending && (
        <button
          type="button"
          onClick={() => {
            const next = !onlyMobileMoneyPending;
            setOnlyMobileMoneyPending(next);
            if (next) {
              setStatutFilter('EN_ATTENTE');
              setModeFilter('Tous');
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: onlyMobileMoneyPending ? '#059669' : '#ecfdf5',
            color: onlyMobileMoneyPending ? '#ffffff' : '#047857',
            border: `1px solid ${onlyMobileMoneyPending ? '#059669' : '#a7f3d0'}`,
            transition: 'all 0.15s ease',
          }}
          title="Afficher uniquement les demandes Mobile Money soumises par les locataires en attente de validation"
        >
          <Smartphone size={13} />
          <span>Mobile Money à valider</span>
          {mobileMoneyPendingCount !== undefined && (
            <span
              style={{
                backgroundColor: onlyMobileMoneyPending ? 'rgba(255,255,255,0.25)' : '#10b981',
                color: '#ffffff',
                borderRadius: '999px',
                padding: '1px 6px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {mobileMoneyPendingCount}
            </span>
          )}
        </button>
      )}

      <select 
        className="filter-select" 
        value={onlyMobileMoneyPending ? 'EN_ATTENTE' : statutFilter} 
        onChange={(e) => {
          if (setOnlyMobileMoneyPending) setOnlyMobileMoneyPending(false);
          setStatutFilter(e.target.value);
        }}
        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
      >
        <option value="Tous">Tous les statuts</option>
        <option value="EN_ATTENTE">En attente</option>
        <option value="PAYE">Payé</option>
        <option value="PARTIEL">Partiel</option>
        <option value="EN_RETARD">En retard</option>
        <option value="ANNULE">Annulé</option>
      </select>

      <select 
        className="filter-select" 
        value={onlyMobileMoneyPending ? 'Tous' : modeFilter} 
        onChange={(e) => {
          if (setOnlyMobileMoneyPending) setOnlyMobileMoneyPending(false);
          setModeFilter(e.target.value);
        }}
        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
      >
        <option value="Tous">Tous les modes</option>
        <option value="MVOLA">Mvola</option>
        <option value="ORANGE_MONEY">Orange Money</option>
        <option value="AIRTEL_MONEY">Airtel Money</option>
        <option value="VIREMENT">Virement</option>
        <option value="CHEQUE">Chèque</option>
        <option value="ESPECE">Espèce</option>
      </select>

      {isFiltered && (
        <button 
          onClick={resetFilters}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '4px', 
            background: 'none', border: 'none', color: '#ef4444', 
            fontSize: '13px', cursor: 'pointer', padding: '8px'
          }}
        >
          <X size={14} /> Réinitialiser
        </button>
      )}
    </div>
  )
}
