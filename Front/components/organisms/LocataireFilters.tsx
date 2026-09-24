import { SlidersHorizontal } from 'lucide-react'

type LocataireFiltersProps = {
  statutFilter: string
  setStatutFilter: (val: string) => void
}

export function LocataireFilters({ statutFilter, setStatutFilter }: LocataireFiltersProps) {
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
