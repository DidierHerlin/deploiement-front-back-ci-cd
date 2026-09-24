import { SlidersHorizontal } from 'lucide-react'

type UserFiltersProps = {
  roleFilter: string
  onRoleFilterChange: (val: string) => void
}

export function UserFilters({ roleFilter, onRoleFilterChange }: UserFiltersProps) {
  return (
    <>
      <select 
        value={roleFilter} 
        onChange={(e) => onRoleFilterChange(e.target.value)} 
        aria-label="Filtrer par rôle"
      >
        <option>Tous les rôles</option>
        <option>Admin</option>
        <option>Agent</option>
        <option>Propriétaire</option>
        <option>Locataire</option>
      </select>
      <button className="filter-button">
        <SlidersHorizontal size={15} /> Filtres
      </button>
    </>
  )
}
