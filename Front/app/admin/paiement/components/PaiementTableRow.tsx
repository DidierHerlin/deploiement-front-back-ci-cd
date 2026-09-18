import { Eye, Edit, Download } from 'lucide-react'
import { Paiement, downloadQuittance } from '@/lib/api'
import { PaiementStatusBadge } from './PaiementStatusBadge'

type PaiementTableRowProps = {
  paiement: Paiement
  onView: (p: Paiement) => void
  onEdit: (p: Paiement) => void
}

export function PaiementTableRow({ paiement, onView, onEdit }: PaiementTableRowProps) {
  const formatDate = (d: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  const formatMontant = (m: string | null) => {
    if (!m) return '-'
    return Number(m).toLocaleString('fr-FR') + ' Ar'
  }

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 500 }}>#{paiement.id}</div>
        <small style={{ color: '#64748b' }}>Éch. {paiement.num_echeance || '-'}</small>
      </td>
      <td>{paiement.bien_titre}</td>
      <td>{paiement.locataire_nom}</td>
      <td>
        <div style={{ fontWeight: 600 }}>{formatMontant(paiement.montant_paye && parseFloat(paiement.montant_paye) > 0 ? paiement.montant_paye : paiement.montant_attendu)}</div>
        {paiement.est_partiel && <small style={{ color: '#dc2626' }}>Reste : {formatMontant(paiement.montant_restant)}</small>}
      </td>
      <td>
        <div style={{ fontSize: '13px' }}><span style={{ color: '#64748b' }}>Éch:</span> {formatDate(paiement.date_echeance)}</div>
        {paiement.date_paiement && <div style={{ fontSize: '13px' }}><span style={{ color: '#10b981' }}>Payé:</span> {formatDate(paiement.date_paiement)}</div>}
      </td>
      <td><PaiementStatusBadge statut={paiement.statut} /></td>
      <td>{paiement.mode_paiement || '-'}</td>
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
          {paiement.statut === 'PAYE' && (
            <button className="action-icon" onClick={() => downloadQuittance(paiement.id)} title="Télécharger la quittance" style={{ color: '#2563eb' }}>
              <Download size={16} />
            </button>
          )}
          {paiement.statut !== 'PAYE' && paiement.statut !== 'ANNULE' && (
            <button className="action-icon" onClick={() => onEdit(paiement)} title="Enregistrer / Valider">
              <Edit size={16} />
            </button>
          )}
          <button className="action-icon" onClick={() => onView(paiement)} title="Détails">
            <Eye size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
