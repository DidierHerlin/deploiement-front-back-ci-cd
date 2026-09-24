type PaiementStatusBadgeProps = {
  statut: string
}

export function PaiementStatusBadge({ statut }: PaiementStatusBadgeProps) {
  let color = '#64748b'
  let bg = '#f1f5f9'
  let label = statut

  switch (statut) {
    case 'PAYE':
      color = '#059669'
      bg = '#d1fae5'
      label = 'Payé'
      break
    case 'EN_ATTENTE':
      color = '#d97706'
      bg = '#fef3c7'
      label = 'En attente'
      break
    case 'PARTIEL':
      color = '#2563eb'
      bg = '#dbeafe'
      label = 'Partiel'
      break
    case 'EN_RETARD':
      color = '#dc2626'
      bg = '#fee2e2'
      label = 'En retard'
      break
    case 'ANNULE':
      color = '#475569'
      bg = '#e2e8f0'
      label = 'Annulé'
      break
  }

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      color: color,
      backgroundColor: bg
    }}>
      {label}
    </span>
  )
}
