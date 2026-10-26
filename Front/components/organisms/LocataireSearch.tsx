import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type LocataireSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function LocataireSearch({ query, onQueryChange }: LocataireSearchProps) {
  const { t } = useTranslation()
  return (
    <div className="search-box table-search">
      <Search size={16} />
      <input 
        aria-label={t("admin.locataires.search_placeholder", "Rechercher un locataire")} 
        placeholder={t("admin.locataires.search_placeholder", "Rechercher par nom, email, contact...")} 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
