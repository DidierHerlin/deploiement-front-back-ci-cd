import { Search } from 'lucide-react'

type LocataireSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function LocataireSearch({ query, onQueryChange }: LocataireSearchProps) {
  return (
    <div className="search-box table-search">
      <Search size={16} />
      <input 
        aria-label="Rechercher un locataire" 
        placeholder="Rechercher (nom, prénom, email, tel)" 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
