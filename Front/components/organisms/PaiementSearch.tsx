import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type PaiementSearchProps = {
  query: string
  onQueryChange: (query: string) => void
}

export function PaiementSearch({ query, onQueryChange }: PaiementSearchProps) {
  const { t } = useTranslation()
  return (
    <div className="search-bar">
      <Search size={18} color="#94a3b8" />
      <input 
        type="text" 
        placeholder={t("admin.paiements.search_placeholder", "Rechercher par locataire, bien, référence...")} 
        value={query}
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
