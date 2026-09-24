import { Filter, X } from 'lucide-react'

type PaiementFiltersProps = {
  statutFilter: string
  setStatutFilter: (s: string) => void
  modeFilter: string
  setModeFilter: (m: string) => void
}

export function PaiementFilters({ statutFilter, setStatutFilter, modeFilter, setModeFilter }: PaiementFiltersProps) {
  const isFiltered = statutFilter !== 'Tous' || modeFilter !== 'Tous'

  const resetFilters = () => {
    setStatutFilter('Tous')
    setModeFilter('Tous')
  }

  return (
    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
        <Filter size={16} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Filtres :</span>
      </div>

      <select 
        className="filter-select" 
        value={statutFilter} 
        onChange={(e) => setStatutFilter(e.target.value)}
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
        value={modeFilter} 
        onChange={(e) => setModeFilter(e.target.value)}
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
