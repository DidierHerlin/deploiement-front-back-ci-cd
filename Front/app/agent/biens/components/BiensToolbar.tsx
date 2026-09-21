'use client'
import { Search } from 'lucide-react'

type BiensToolbarProps = {
  search: string
  setSearch: (v: string) => void
  status: string
  setStatus: (v: string) => void
  type: string
  setType: (v: string) => void
}

export default function BiensToolbar({
  search, setSearch, status, setStatus, type, setType
}: BiensToolbarProps) {
  return (
    <div className="agent-toolbar">
      <div className="agent-search">
        <Search size={16} />
        <input aria-label="Rechercher un bien" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou adresse..." />
      </div>
      <select className="agent-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par statut">
        <option>Tous les statuts</option>
        <option>Disponible</option>
        <option>Loué</option>
        <option>Réservé</option>
        <option>En travaux</option>
        <option>Vendu</option>
      </select>
      <select className="agent-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filtrer par type">
        <option>Tous les types</option>
        <option>Appartement</option>
        <option>Studio</option>
        <option>Maison</option>
        <option>Loft</option>
        <option>Bureau</option>
        <option>Terrain</option>
      </select>
    </div>
  )
}
