import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type BienSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function BienSearch({ query, onQueryChange }: BienSearchProps) {
  const { t } = useTranslation()
  return (
    <div className="search-box table-search">
      <Search size={16} />
      <input 
        aria-label={t("admin.biens.search_placeholder", "Rechercher un bien")} 
        placeholder={t("admin.biens.search_placeholder", "Rechercher par titre ou adresse")} 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
