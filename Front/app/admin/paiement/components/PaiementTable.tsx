import { useState } from 'react'
import { Paiement } from '@/lib/api'
import { PaiementTableRow } from './PaiementTableRow'
import { Pagination } from '@/components/ui/pagination'

type PaiementTableProps = {
  paiements: Paiement[]
  loading: boolean
  error?: string | null
  onView: (p: Paiement) => void
  onEdit: (p: Paiement) => void
}

export function PaiementTable({ paiements, loading, error, onView, onEdit }: PaiementTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(paiements.length / ITEMS_PER_PAGE);
  const paginatedData = paiements.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-wrap" style={{ flex: 1 }}>
        <table>
          <thead>
            <tr>
              <th>Réf / Échéance</th>
              <th>Bien immobilier</th>
              <th>Locataire / Acheteur</th>
              <th>Montant</th>
              <th>Dates (Prévu / Payé)</th>
              <th>Statut</th>
              <th>Mode</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>Chargement...</td></tr>
            ) : error ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#dc2626' }}>{error}</td></tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map(p => (
                <PaiementTableRow 
                  key={p.id}
                  paiement={p}
                  onView={onView}
                  onEdit={onEdit}
                />
              ))
            ) : (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>Aucun paiement trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
