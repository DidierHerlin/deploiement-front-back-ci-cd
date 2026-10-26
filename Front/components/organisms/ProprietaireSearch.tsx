import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type ProprietaireSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function ProprietaireSearch({ query, onQueryChange }: ProprietaireSearchProps) {
  const { t } = useTranslation()
  return (
    <div className="search-box table-search">
      <Search size={16} />
      <input 
        aria-label={t("admin.proprietaires.search_placeholder", "Rechercher un propriétaire")} 
        placeholder={t("admin.proprietaires.search_placeholder", "Rechercher par nom, email, téléphone ou IBAN...")} 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
