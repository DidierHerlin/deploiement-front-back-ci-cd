import { SlidersHorizontal } from 'lucide-react'

type ProprietaireFiltersProps = {
  statutFilter: string
  setStatutFilter: (val: string) => void
}

export function ProprietaireFilters({ statutFilter, setStatutFilter }: ProprietaireFiltersProps) {
  return (
    <>
      <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} aria-label="Filtrer par statut">
        <option value="Tous">Tous les statuts</option>
        <option value="Actif">Actif</option>
        <option value="Désactivé">Désactivé</option>
      </select>
      <button className="filter-button"><SlidersHorizontal size={15} />Filtres</button>
    </>
  )
}
