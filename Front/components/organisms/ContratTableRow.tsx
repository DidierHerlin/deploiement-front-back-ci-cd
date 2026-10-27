import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Contrat } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type ContratTableRowProps = {
  contrat: Contrat
  onView: (c: Contrat) => void
  onEdit: (c: Contrat) => void
  onDelete: (c: Contrat) => void
}

export function ContratTableRow({ contrat, onView, onEdit, onDelete }: ContratTableRowProps) {
  const { t } = useTranslation()
  
  const formatCurrency = (val: any) => {
    if (val === null || val === undefined) return '-'
    return `${Number(val).toLocaleString('fr-FR')} Ar`
  }

  const renderStatut = (statut: string) => {
    switch (statut) {
      case 'ACTIF': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t("dashboard.common.active", "Actif")}
          </span>
        )
      case 'RESERVE': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t("dashboard.common.status_reserve", "Réservé")}
          </span>
        )
      case 'RESILIE': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border dark:border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {t("dashboard.common.status_resilie", "Résilié")}
          </span>
        )
      case 'TERMINE': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {t("dashboard.common.status_termine", "Terminé")}
          </span>
        )
      case 'VENDU': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border dark:border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {t("dashboard.common.status_vendu", "Vendu")}
          </span>
        )
      default: 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {statut}
          </span>
        )
    }
  }

  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
      <td className="text-xs font-semibold text-slate-600 dark:text-slate-400">#{contrat.id}</td>
      <td>
        <strong className="text-slate-900 dark:text-slate-100 block">{contrat.bien_titre}</strong>
        <small className="block text-slate-500 dark:text-slate-400 text-xs mt-0.5">{contrat.bien_type}</small>
      </td>
      <td>
        <strong className="text-slate-900 dark:text-slate-100 block">{contrat.locataire_prenoms} {contrat.locataire_nom}</strong>
      </td>
      <td>
        {contrat.type_contrat === 'LOCATION' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:border dark:border-blue-500/30">
            {t("card.for_rent", 'Location')}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-500/15 dark:text-purple-400 dark:border dark:border-purple-500/30">
            {t("card.for_sale", 'Achat')}
          </span>
        )}
      </td>
      <td className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
        {contrat.type_contrat === 'LOCATION' 
          ? formatCurrency(contrat.loyer) 
          : formatCurrency(contrat.prix)}
      </td>
      <td>{renderStatut(contrat.statut)}</td>
      <td>
        <div className="flex items-center justify-end gap-1.5">
          <button 
            aria-label={t("forms.view", "Voir")} 
            onClick={() => onView(contrat)} 
            title={t("forms.view", "Détails")}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Eye size={15} />
          </button>
          
          {contrat.statut !== 'VENDU' && (
            <button 
              aria-label={t("forms.edit", "Modifier")} 
              onClick={() => onEdit(contrat)} 
              title={t("forms.edit", "Modifier")}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Pencil size={15} />
            </button>
          )}

          <button 
            aria-label={t("forms.delete", "Supprimer")} 
            onClick={() => onDelete(contrat)} 
            title={t("forms.delete", "Supprimer")} 
            className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
