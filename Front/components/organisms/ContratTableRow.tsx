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
      case 'ACTIF': return <span className="status paid"><i />{t("dashboard.common.active", "Actif")}</span>
      case 'RESERVE': return <span className="status pending"><i />{t("dashboard.common.status_reserve", "Réservé")}</span>
      case 'RESILIE': return <span className="status disabled"><i />{t("dashboard.common.status_resilie", "Résilié")}</span>
      case 'TERMINE': return <span className="status disabled"><i />{t("dashboard.common.status_termine", "Terminé")}</span>
      case 'VENDU': return <span className="status paid" style={{ background: '#e0e7ff', color: '#4f46e5' }}><i style={{ background: '#4f46e5' }} />{t("dashboard.common.status_vendu", "Vendu")}</span>
      default: return <span className="status disabled"><i />{statut}</span>
    }
  }

  return (
    <tr>
      <td>#{contrat.id}</td>
      <td>
        <strong>{contrat.bien_titre}</strong>
        <small style={{ display: 'block', color: '#666' }}>{contrat.bien_type}</small>
      </td>
      <td>
        <strong>{contrat.locataire_prenoms} {contrat.locataire_nom}</strong>
      </td>
      <td>
        <span className="role-badge">{contrat.type_contrat === 'LOCATION' ? t("card.for_rent", 'Location') : t("card.for_sale", 'Achat')}</span>
      </td>
      <td>
        {contrat.type_contrat === 'LOCATION' 
          ? formatCurrency(contrat.loyer) 
          : formatCurrency(contrat.prix)}
      </td>
      <td>{renderStatut(contrat.statut)}</td>
      <td>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button aria-label={t("forms.view", "Voir")} onClick={() => onView(contrat)} title={t("forms.view", "Détails")}><Eye size={15} /></button>
          
          {contrat.statut !== 'VENDU' && (
            <button aria-label={t("forms.edit", "Modifier")} onClick={() => onEdit(contrat)} title={t("forms.edit", "Modifier")}><Pencil size={15} /></button>
          )}

          <button aria-label={t("forms.delete", "Supprimer")} onClick={() => onDelete(contrat)} title={t("forms.delete", "Supprimer")} style={{ color: '#ef6a76' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
