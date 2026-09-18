import { SlidersHorizontal } from 'lucide-react'
import { Proprietaire } from '@/lib/api'

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
  return (
    <>
      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filtrer par type">
        <option value="Tous">Tous les types</option>
        <option value="APPARTEMENT">Appartement</option>
        <option value="MAISON">Maison</option>
        <option value="LOCAL_COMMERCIAL">Local commercial</option>
        <option value="TERRAIN">Terrain</option>
      </select>
      
      <select value={operationFilter} onChange={(e) => setOperationFilter(e.target.value)} aria-label="Filtrer par opération">
        <option value="Toutes">Toutes les opérations</option>
        <option value="LOCATION">Location</option>
        <option value="VENTE">Vente</option>
      </select>
      
      <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} aria-label="Filtrer par statut">
        <option value="Tous">Tous les statuts</option>
        <option value="DISPONIBLE">Disponible</option>
        <option value="RESERVE">Réservé</option>
        <option value="LOUE">Loué</option>
        <option value="VENDU">Vendu</option>
        <option value="EN_TRAVAUX">En travaux</option>
      </select>
      
      <select value={proprietaireFilter} onChange={(e) => setProprietaireFilter(e.target.value)} aria-label="Filtrer par propriétaire">
        <option value="Tous">Tous les propriétaires</option>
        {proprietaires.map(p => (
          <option key={p.id} value={p.id.toString()}>{p.user.prenoms} {p.user.nom}</option>
        ))}
      </select>

      <button className="filter-button"><SlidersHorizontal size={15} />Filtres</button>
    </>
  )
}
