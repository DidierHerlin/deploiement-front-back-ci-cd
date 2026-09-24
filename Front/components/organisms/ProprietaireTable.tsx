import { useState } from 'react'
import { Proprietaire } from '@/lib/api'
import { ProprietaireTableRow } from "@/components/organisms/ProprietaireTableRow"
import { Pagination } from "@/components/molecules/pagination"

type ProprietaireTableProps = {
  proprietaires: Proprietaire[]
  loading: boolean
  onView: (prop: Proprietaire) => void
  onEdit: (prop: Proprietaire) => void
  onDisable: (prop: Proprietaire) => void
  biensCountMap: Record<number, number>
}

export function ProprietaireTable({ proprietaires, loading, onView, onEdit, onDisable, biensCountMap }: ProprietaireTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(proprietaires.length / ITEMS_PER_PAGE);
  const paginatedData = proprietaires.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-wrap" style={{ flex: 1 }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>PROPRIÉTAIRE</th>
              <th>CONTACT</th>
              <th>BIENS</th>
              <th>STATUT</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Chargement...</td></tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map(p => (
                <ProprietaireTableRow 
                  key={p.id}
                  proprietaire={p}
                  biensCount={biensCountMap[p.id] || 0}
                  onView={onView}
                  onEdit={onEdit}
                  onDisable={onDisable}
                />
              ))
            ) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>Aucun propriétaire trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
