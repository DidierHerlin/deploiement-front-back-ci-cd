import { useState } from 'react'
import { Contrat } from '@/lib/api'
import { ContratTableRow } from './ContratTableRow'
import { Pagination } from '@/components/ui/pagination'

type ContratTableProps = {
  contrats: Contrat[]
  loading: boolean
  error?: string | null
  onView: (c: Contrat) => void
  onEdit: (c: Contrat) => void
  onDelete: (c: Contrat) => void
}

export function ContratTable({ contrats, loading, error, onView, onEdit, onDelete }: ContratTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(contrats.length / ITEMS_PER_PAGE);
  const paginatedData = contrats.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-wrap" style={{ flex: 1 }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>BIEN</th>
              <th>LOCATAIRE / ACHETEUR</th>
              <th>TYPE</th>
              <th>MONTANT</th>
              <th>STATUT</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Chargement...</td></tr>
            ) : error ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#dc2626' }}>{error}</td></tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map(c => (
                <ContratTableRow 
                  key={c.id}
                  contrat={c}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>Aucun contrat trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
