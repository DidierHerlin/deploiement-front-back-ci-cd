import { Search } from 'lucide-react'

type PaiementSearchProps = {
  query: string
  onQueryChange: (query: string) => void
}

export function PaiementSearch({ query, onQueryChange }: PaiementSearchProps) {
  return (
    <div className="search-bar">
      <Search size={18} color="#94a3b8" />
      <input 
        type="text" 
        placeholder="Rechercher (Locataire, Bien, Réf...)" 
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
    </div>
  )
}
