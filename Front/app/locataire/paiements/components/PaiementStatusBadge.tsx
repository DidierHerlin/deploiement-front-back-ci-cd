import React from 'react';

export function PaiementStatusBadge({ status, estPartiel, estEnRetard }: { status: string, estPartiel?: boolean, estEnRetard?: boolean }) {
  if (estEnRetard || status === 'EN_RETARD') {
    return <span className="status pending" style={{ color: '#dc5a62', background: '#fff0f1' }}><i style={{ background: '#dc5a62' }} />En retard</span>;
  }
  
  if (estPartiel || status === 'PARTIEL') {
    return <span className="status pending"><i />Partiel</span>;
  }
  
  switch (status) {
    case 'PAYE':
    case 'VALIDE':
      return <span className="status paid"><i />Payé</span>;
    case 'EN_ATTENTE':
      return <span className="status pending"><i />En attente</span>;
    case 'ANNULE':
      return <span className="status disabled"><i />Annulé</span>;
    default:
      return <span className="status"><i />{status}</span>;
  }
}
