import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type LocataireSearchProps = {
  query: string
  onQueryChange: (val: string) => void
}

export function LocataireSearch({ query, onQueryChange }: LocataireSearchProps) {
  const { t } = useTranslation()
  return (
    <div className="search-box table-search flex items-center gap-2 text-slate-400 dark:text-slate-500">
      <Search size={16} />
      <input 
        aria-label={t("admin.locataires.search_placeholder", "Rechercher un locataire")} 
        placeholder={t("admin.locataires.search_placeholder", "Rechercher par nom, email, contact...")} 
        value={query} 
        onChange={(e) => onQueryChange(e.target.value)} 
        className="bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none w-full"
      />
    </div>
  )
}
