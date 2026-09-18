import { useState } from 'react'
import { UserProfil } from '@/lib/api'
import { UserTableHeader } from './UserTableHeader'
import { UserTableRow } from './UserTableRow'
import { Pagination } from '@/components/ui/pagination'

type UserTableProps = {
  users: UserProfil[]
  loading: boolean
  onView: (user: UserProfil) => void
  onEdit: (user: UserProfil) => void
  onToggleStatus: (user: UserProfil) => void
  onDelete: (id: number) => void
}

export function UserTable({ users, loading, onView, onEdit, onToggleStatus, onDelete }: UserTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedData = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-wrap" style={{ flex: 1 }}>
        <table>
          <UserTableHeader />
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Chargement...</td></tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map(user => (
                <UserTableRow 
                  key={user.id}
                  user={user}
                  onView={onView}
                  onEdit={onEdit}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>Aucun utilisateur trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
