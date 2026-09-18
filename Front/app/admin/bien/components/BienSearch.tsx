import { Search } from 'lucide-react'

type BienSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function BienSearch({ query, onQueryChange }: BienSearchProps) {
  return (
    <div className="search-box table-search">
      <Search size={16} />
      <input 
        aria-label="Rechercher un bien" 
        placeholder="Rechercher par titre ou adresse" 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
