type PaiementStatusBadgeProps = {
  statut: string
  contratStatut?: string | null
}

export function PaiementStatusBadge({ statut, contratStatut }: PaiementStatusBadgeProps) {
  let colorClass = 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
  let label = statut

  const isContratResilie = Boolean(contratStatut && ['RESILIE', 'RÉSILIÉ'].includes(contratStatut.trim().toUpperCase()))
  const effectiveStatut = (isContratResilie && (statut === 'ANNULE' || !statut)) || statut === 'RESILIE'
    ? 'RESILIE'
    : statut

  switch (effectiveStatut) {
    case 'PAYE':
      colorClass = 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60'
      label = 'Payé'
      break
    case 'EN_ATTENTE':
      colorClass = 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60'
      label = 'En attente'
      break
    case 'PARTIEL':
      colorClass = 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60'
      label = 'Partiel'
      break
    case 'EN_RETARD':
      colorClass = 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60'
      label = 'En retard'
      break
    case 'ANNULE':
      colorClass = 'text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
      label = 'Annulé'
      break
    case 'RESILIE':
      colorClass = 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60'
      label = 'Résilié'
      break
  }

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label}
    </span>
  )
}
