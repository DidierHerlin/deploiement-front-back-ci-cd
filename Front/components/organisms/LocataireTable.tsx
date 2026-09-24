import { useState } from 'react'
import { Locataire } from '@/lib/api'
import { LocataireTableRow } from "@/components/organisms/LocataireTableRow"
import { Pagination } from "@/components/molecules/pagination"

type LocataireTableProps = {
  locataires: Locataire[]
  loading: boolean
  error?: string | null
  contratsCountMap: Record<number, number>
  biensCountMap: Record<number, number>
  onView: (loc: Locataire) => void
  onEdit: (loc: Locataire) => void
  onDisable: (loc: Locataire) => void
}

export function LocataireTable({ locataires, loading, error, contratsCountMap, biensCountMap, onView, onEdit, onDisable }: LocataireTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(locataires.length / ITEMS_PER_PAGE);
  const paginatedData = locataires.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-wrap" style={{ flex: 1 }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>LOCATAIRE</th>
              <th>EMAIL</th>
              <th>TÉLÉPHONE</th>
              <th>CONTRATS</th>
              <th>BIENS LOUÉS</th>
              <th>STATUT</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>Chargement...</td></tr>
            ) : error ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#dc2626' }}>{error}</td></tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map(l => (
                <LocataireTableRow 
                  key={l.id}
                  locataire={l}
                  contratsCount={contratsCountMap[l.id] || 0}
                  biensCount={biensCountMap[l.id] || 0}
                  onView={onView}
                  onEdit={onEdit}
                  onDisable={onDisable}
                />
              ))
            ) : (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>Aucun locataire trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
