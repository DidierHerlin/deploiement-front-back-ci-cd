import { useState } from 'react'
import { Contrat } from '@/lib/api'
import { ContratTableRow } from "@/components/organisms/ContratTableRow"
import { Pagination } from "@/components/molecules/pagination"
import { useTranslation } from '@/lib/i18n'

type ContratTableProps = {
  contrats: Contrat[]
  loading: boolean
  error?: string | null
  onView: (c: Contrat) => void
  onEdit: (c: Contrat) => void
  onDelete: (c: Contrat) => void
}

export function ContratTable({ contrats, loading, error, onView, onEdit, onDelete }: ContratTableProps) {
  const { t } = useTranslation()
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
              <th>{t("admin.biens.col_id", "ID")}</th>
              <th>{t("admin.contrats.col_property", "BIEN")}</th>
              <th>{t("admin.contrats.col_tenant", "LOCATAIRE / ACHETEUR")}</th>
              <th>{t("admin.contrats.col_type", "TYPE")}</th>
              <th>{t("admin.paiements.col_amount", "MONTANT")}</th>
              <th>{t("admin.contrats.col_status", "STATUT")}</th>
              <th style={{ textAlign: 'right' }}>{t("admin.contrats.col_actions", "ACTIONS")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t("forms.loading", "Chargement...")}</td></tr>
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
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>{t("admin.contrats.empty", "Aucun contrat trouvé.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
