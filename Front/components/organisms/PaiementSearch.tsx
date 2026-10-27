import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type PaiementSearchProps = {
  query: string
  onQueryChange: (query: string) => void
}

export function PaiementSearch({ query, onQueryChange }: PaiementSearchProps) {
  const { t } = useTranslation()
  return (
    <div className="relative flex items-center flex-1 min-w-[280px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input 
        type="text" 
        className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
        placeholder={t("admin.paiements.search_placeholder", "Rechercher par locataire, bien, référence...")} 
        value={query}
        onChange={(e) => onQueryChange(e.target.value)} 
      />
    </div>
  )
}
