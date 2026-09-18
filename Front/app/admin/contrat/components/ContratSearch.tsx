import { Search } from 'lucide-react'

type ContratSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function ContratSearch({ query, onQueryChange }: ContratSearchProps) {
  return (
    <div className="search-box table-search">
      <Search size={16} />
      <input 
        aria-label="Rechercher un contrat" 
        placeholder="Rechercher (référence, bien, locataire)" 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
