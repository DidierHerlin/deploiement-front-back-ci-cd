import { Search } from 'lucide-react'

type ProprietaireSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function ProprietaireSearch({ query, onQueryChange }: ProprietaireSearchProps) {
  return (
    <div className="search-box table-search">
      <Search size={16} />
      <input 
        aria-label="Rechercher un propriétaire" 
        placeholder="Rechercher (nom, prénom, email, tel)" 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
