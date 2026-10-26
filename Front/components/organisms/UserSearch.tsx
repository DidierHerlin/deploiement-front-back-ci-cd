import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type UserSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function UserSearch({ query, onQueryChange }: UserSearchProps) {
  const { t } = useTranslation()
  return (
    <div className="search-box table-search">
      <Search size={16} />
      <input 
        aria-label={t("admin.users.search_placeholder", "Rechercher un utilisateur")} 
        placeholder={t("admin.users.search_placeholder", "Rechercher un nom ou email")} 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
