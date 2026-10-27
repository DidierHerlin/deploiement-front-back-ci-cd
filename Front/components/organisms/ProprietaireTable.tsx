import { useState } from 'react'
import { Proprietaire } from '@/lib/api'
import { ProprietaireTableRow } from "@/components/organisms/ProprietaireTableRow"
import { Pagination } from "@/components/molecules/pagination"
import { useTranslation } from '@/lib/i18n'

type ProprietaireTableProps = {
  proprietaires: Proprietaire[]
  loading: boolean
  onView: (prop: Proprietaire) => void
  onEdit: (prop: Proprietaire) => void
  onDisable: (prop: Proprietaire) => void
  biensCountMap: Record<number, number>
}

export function ProprietaireTable({ proprietaires, loading, onView, onEdit, onDisable, biensCountMap }: ProprietaireTableProps) {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(proprietaires.length / ITEMS_PER_PAGE);
  const paginatedData = proprietaires.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-wrap flex-1">
        <table>
          <thead>
            <tr>
              <th>{t("admin.biens.col_id", "ID")}</th>
              <th>{t("admin.proprietaires.col_owner", "PROPRIÉTAIRE")}</th>
              <th>{t("admin.proprietaires.col_contact", "CONTACT & IBAN")}</th>
              <th>{t("admin.proprietaires.col_properties_count", "PATRIMOINE")}</th>
              <th>{t("admin.proprietaires.col_status", "STATUT")}</th>
              <th style={{ textAlign: 'right' }}>{t("admin.proprietaires.col_actions", "ACTIONS")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400 dark:text-slate-500">{t("forms.loading", "Chargement...")}</td></tr>
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
              <tr><td colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500">{t("admin.proprietaires.empty", "Aucun propriétaire trouvé.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
