import { SlidersHorizontal } from 'lucide-react'

type ContratFiltersProps = {
  typeFilter: string
  setTypeFilter: (val: string) => void
  statutFilter: string
  setStatutFilter: (val: string) => void
}

export function ContratFilters({ typeFilter, setTypeFilter, statutFilter, setStatutFilter }: ContratFiltersProps) {
  return (
    <>
      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filtrer par type">
        <option value="Tous">Tous les types</option>
        <option value="LOCATION">Location</option>
        <option value="ACHAT">Achat</option>
      </select>
      
      <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} aria-label="Filtrer par statut">
        <option value="Tous">Tous les statuts</option>
        <option value="RESERVE">Réservé</option>
        <option value="ACTIF">Actif</option>
        <option value="RESILIE">Résilié</option>
        <option value="TERMINE">Terminé</option>
        <option value="VENDU">Vendu</option>
      </select>

      <button className="filter-button"><SlidersHorizontal size={15} />Filtres</button>
    </>
  )
}
