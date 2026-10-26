import { useState } from 'react'
import { Locataire } from '@/lib/api'
import { LocataireTableRow } from "@/components/organisms/LocataireTableRow"
import { Pagination } from "@/components/molecules/pagination"
import { useTranslation } from '@/lib/i18n'

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
  const { t } = useTranslation()
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
              <th>{t("admin.biens.col_id", "ID")}</th>
              <th>{t("admin.locataires.col_tenant", "LOCATAIRE")}</th>
              <th>{t("profile.email", "EMAIL")}</th>
              <th>{t("profile.phone", "TÉLÉPHONE")}</th>
              <th>{t("admin.locataires.col_lease", "CONTRATS")}</th>
              <th>{t("admin.proprietaires.col_properties_count", "BIENS LOUÉS")}</th>
              <th>{t("admin.locataires.col_status", "STATUT")}</th>
              <th style={{ textAlign: 'right' }}>{t("admin.locataires.col_actions", "ACTIONS")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>{t("forms.loading", "Chargement...")}</td></tr>
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
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>{t("admin.locataires.empty", "Aucun locataire trouvé.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
