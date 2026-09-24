import { Search } from 'lucide-react'

type UserSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function UserSearch({ query, onQueryChange }: UserSearchProps) {
  return (
    <div className="search-box table-search">
      <Search size={16} />
      <input 
        aria-label="Rechercher un utilisateur" 
        placeholder="Rechercher un nom ou email" 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
