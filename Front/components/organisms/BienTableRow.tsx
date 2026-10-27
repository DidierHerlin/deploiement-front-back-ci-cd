import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Bien, Proprietaire } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

export function getProprietaireName(bien: Bien, proprietaires?: Proprietaire[]): string | null {
  if (!bien) return null

  // 1. Structure imbriquée standard : bien.proprietaire.user
  const user = bien.proprietaire?.user
  if (user && (user.nom || user.prenoms)) {
    const full = `${user.prenoms || ''} ${user.nom || ''}`.trim()
    if (full) return full
  }

  // 2. Propriété directe : bien.proprietaire.nom / prenoms
  const propDirect = bien.proprietaire as any
  if (propDirect && (propDirect.nom || propDirect.prenoms)) {
    const full = `${propDirect.prenoms || ''} ${propDirect.nom || ''}`.trim()
    if (full) return full
  }

  // 3. Propriétés dérivées : proprietaire_nom / owner_name
  const altName = (bien as any).proprietaire_nom || (bien as any).owner_name || (bien as any).nom_proprietaire
  if (typeof altName === 'string' && altName.trim()) {
    return altName.trim()
  }

  // 4. Si nous avons un ID et la liste des propriétaires
  const propId = typeof bien.proprietaire === 'number' 
    ? bien.proprietaire 
    : bien.proprietaire?.id || (bien as any).proprietaire_id
  if (propId && proprietaires && proprietaires.length > 0) {
    const p = proprietaires.find(item => item.id === propId)
    if (p) {
      if (p.user && (p.user.nom || p.user.prenoms)) {
        const full = `${p.user.prenoms || ''} ${p.user.nom || ''}`.trim()
        if (full) return full
      }
      if ((p as any).nom || (p as any).prenoms) {
        const full = `${(p as any).prenoms || ''} ${(p as any).nom || ''}`.trim()
        if (full) return full
      }
    }
  }

  return null
}

type BienTableRowProps = {
  bien: Bien
  proprietaires?: Proprietaire[]
  onView: (bien: Bien) => void
  onEdit: (bien: Bien) => void
  onDelete: (id: number) => void
}

export function BienTableRow({ bien, proprietaires, onView, onEdit, onDelete }: BienTableRowProps) {
  const { t } = useTranslation()

  const formatStatut = (statut: string) => {
    switch(statut) {
      case 'DISPONIBLE': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
            <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            {t("dashboard.common.status_disponible", "Disponible")}
          </span>
        )
      case 'RESERVE': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30">
            <i className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            {t("dashboard.common.status_reserve", "Réservé")}
          </span>
        )
      case 'LOUE': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30">
            <i className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            {t("dashboard.common.status_loue", "Loué")}
          </span>
        )
      case 'VENDU': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <i className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {t("dashboard.common.status_vendu", "Vendu")}
          </span>
        )
      case 'EN_TRAVAUX': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
            <i className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
            {t("dashboard.common.status_en_travaux", "En travaux")}
          </span>
        )
      default: 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <i className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {statut}
          </span>
        )
    }
  }

  const getPrixLoyer = () => {
    if (bien.mode_transaction === 'VENTE') {
      return bien.prix ? `${Number(bien.prix).toLocaleString('fr-FR')} Ar` : 'N/A'
    } else {
      return bien.loyer_mensuel ? `${Number(bien.loyer_mensuel).toLocaleString('fr-FR')} Ar ${t("card.per_month", "/ mois")}` : 'N/A'
    }
  }

  const formatType = (type: string) => {
    switch(type) {
      case 'APPARTEMENT': return t("types.apartment", 'Appartement')
      case 'MAISON': return t("types.house", 'Maison')
      case 'LOCAL_COMMERCIAL': return t("types.commercial", 'Local commercial')
      case 'TERRAIN': return t("types.land", 'Terrain')
      default: return type
    }
  }

  const ownerName = getProprietaireName(bien, proprietaires)

  return (
    <tr>
      <td>
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">#{bien.id}</span>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong className="text-slate-900 dark:text-slate-100">{bien.titre}</strong>
          <small className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{bien.adresse}</small>
        </div>
      </td>
      <td>
        <span className="role-badge dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700">
          {formatType(bien.type)}
        </span>
      </td>
      <td className="text-slate-700 dark:text-slate-300 font-medium">{bien.surface} m²</td>
      <td>
        {ownerName ? (
          <span className="text-slate-800 dark:text-slate-200 font-medium">{ownerName}</span>
        ) : (
          <span className="italic text-slate-400 dark:text-slate-500 text-xs">
            {t("admin.biens.unassigned", "Non affecté")}
          </span>
        )}
      </td>
      <td>
        <span className="role-badge dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700">
          {bien.mode_transaction === 'VENTE' ? t("card.for_sale", 'Vente') : t("card.for_rent", 'Location')}
        </span>
      </td>
      <td>
        <strong className="text-slate-900 dark:text-slate-100">{getPrixLoyer()}</strong>
      </td>
      <td>{formatStatut(bien.statut)}</td>
      <td>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button 
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors" 
            aria-label={t("forms.view", "Voir")} 
            onClick={() => onView(bien)} 
            title={t("forms.view", "Voir détails")}
          >
            <Eye size={15} />
          </button>
          <button 
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors" 
            aria-label={t("forms.edit", "Modifier")} 
            onClick={() => onEdit(bien)} 
            title={t("forms.edit", "Modifier")}
          >
            <Pencil size={15} />
          </button>
          <button 
            className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400/80 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors" 
            aria-label={t("forms.delete", "Supprimer")} 
            onClick={() => onDelete(bien.id)} 
            title={t("forms.delete", "Supprimer")}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
