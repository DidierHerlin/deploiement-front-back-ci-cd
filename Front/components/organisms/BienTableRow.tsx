import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Bien } from '@/lib/api'

type BienTableRowProps = {
  bien: Bien
  onView: (bien: Bien) => void
  onEdit: (bien: Bien) => void
  onDelete: (id: number) => void
}

export function BienTableRow({ bien, onView, onEdit, onDelete }: BienTableRowProps) {
  const formatStatut = (statut: string) => {
    switch(statut) {
      case 'DISPONIBLE': return <span className="status paid"><i />Disponible</span>
      case 'RESERVE': return <span className="status pending"><i />Réservé</span>
      case 'LOUE': return <span className="status paid" style={{ background: '#e0e7ff', color: '#4f46e5' }}><i style={{ background: '#4f46e5' }} />Loué</span>
      case 'VENDU': return <span className="status disabled"><i />Vendu</span>
      case 'EN_TRAVAUX': return <span className="status pending" style={{ background: '#fff0f1', color: '#ef6a76' }}><i style={{ background: '#ef6a76' }} />En travaux</span>
      default: return <span className="status disabled"><i />{statut}</span>
    }
  }

  const getPrixLoyer = () => {
    if (bien.mode_transaction === 'VENTE') {
      return bien.prix ? `${Number(bien.prix).toLocaleString('fr-FR')} Ar` : 'N/A'
    } else {
      return bien.loyer_mensuel ? `${Number(bien.loyer_mensuel).toLocaleString('fr-FR')} Ar / mois` : 'N/A'
    }
  }

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'LOCAL_COMMERCIAL': 'Local commercial',
      'TERRAIN': 'Terrain'
    }
    return map[type] || type
  }

  return (
    <tr>
      <td>#{bien.id}</td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{bien.titre}</strong>
          <small style={{ color: '#9aa3b0', fontSize: '10px' }}>{bien.adresse}</small>
        </div>
      </td>
      <td><span className="role-badge">{formatType(bien.type)}</span></td>
      <td>{bien.surface} m²</td>
      <td>{bien.proprietaire?.user?.prenoms} {bien.proprietaire?.user?.nom}</td>
      <td><span className="role-badge">{bien.mode_transaction === 'VENTE' ? 'Vente' : 'Location'}</span></td>
      <td><strong>{getPrixLoyer()}</strong></td>
      <td>{formatStatut(bien.statut)}</td>
      <td>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button aria-label="Voir" onClick={() => onView(bien)} title="Voir détails"><Eye size={15} /></button>
          <button aria-label="Modifier" onClick={() => onEdit(bien)} title="Modifier"><Pencil size={15} /></button>
          <button aria-label="Supprimer" onClick={() => onDelete(bien.id)} title="Supprimer" style={{ color: '#ef6a76' }}><Trash2 size={15} /></button>
        </div>
      </td>
    </tr>
  )
}
