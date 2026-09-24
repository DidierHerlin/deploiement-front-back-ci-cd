import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Contrat } from '@/lib/api'

type ContratTableRowProps = {
  contrat: Contrat
  onView: (c: Contrat) => void
  onEdit: (c: Contrat) => void
  onDelete: (c: Contrat) => void
}

export function ContratTableRow({ contrat, onView, onEdit, onDelete }: ContratTableRowProps) {
  
  const formatCurrency = (val: any) => {
    if (val === null || val === undefined) return '-'
    return `${Number(val).toLocaleString('fr-FR')} Ar`
  }

  const renderStatut = (statut: string) => {
    switch (statut) {
      case 'ACTIF': return <span className="status paid"><i />Actif</span>
      case 'RESERVE': return <span className="status pending"><i />Réservé</span>
      case 'RESILIE': return <span className="status disabled"><i />Résilié</span>
      case 'TERMINE': return <span className="status disabled"><i />Terminé</span>
      case 'VENDU': return <span className="status paid" style={{ background: '#e0e7ff', color: '#4f46e5' }}><i style={{ background: '#4f46e5' }} />Vendu</span>
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
        <span className="role-badge">{contrat.type_contrat}</span>
      </td>
      <td>
        {contrat.type_contrat === 'LOCATION' 
          ? formatCurrency(contrat.loyer) 
          : formatCurrency(contrat.prix)}
      </td>
      <td>{renderStatut(contrat.statut)}</td>
      <td>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button aria-label="Voir" onClick={() => onView(contrat)} title="Détails"><Eye size={15} /></button>
          
          {/* Edit restricted to certain statuses in backend, but we'll always show the button and let backend handle restrictions or hide it here */}
          {contrat.statut !== 'VENDU' && (
            <button aria-label="Modifier" onClick={() => onEdit(contrat)} title="Modifier"><Pencil size={15} /></button>
          )}

          <button aria-label="Supprimer" onClick={() => onDelete(contrat)} title="Supprimer" style={{ color: '#ef6a76' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
