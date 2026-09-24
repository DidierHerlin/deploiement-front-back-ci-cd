import { useState } from 'react'
import { Bien } from '@/lib/api'
import { BienTableHeader } from "@/components/organisms/BienTableHeader"
import { BienTableRow } from "@/components/organisms/BienTableRow"
import { Pagination } from "@/components/molecules/pagination"

type BienTableProps = {
  biens: Bien[]
  loading: boolean
  onView: (bien: Bien) => void
  onEdit: (bien: Bien) => void
  onDelete: (id: number) => void
}

export function BienTable({ biens, loading, onView, onEdit, onDelete }: BienTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(biens.length / ITEMS_PER_PAGE);
  const paginatedData = biens.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-wrap" style={{ flex: 1 }}>
        <table>
          <BienTableHeader />
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>Chargement...</td></tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map(bien => (
                <BienTableRow 
                  key={bien.id}
                  bien={bien}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>Aucun bien trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
