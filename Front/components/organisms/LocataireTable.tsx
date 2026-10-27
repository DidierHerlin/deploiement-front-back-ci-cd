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
      <div className="table-wrap flex-1">
        <table>
          <thead>
            <tr>
              <th className="uppercase">{t("admin.biens.col_id", "ID")}</th>
              <th className="uppercase">{t("admin.locataires.col_tenant", "LOCATAIRE")}</th>
              <th className="uppercase">{t("profile.email", "EMAIL")}</th>
              <th className="uppercase">{t("profile.phone", "TÉLÉPHONE")}</th>
              <th className="uppercase">{t("admin.locataires.col_lease", "BAIL EN COURS")}</th>
              <th className="uppercase">{t("admin.locataires.col_dossiers", "DOSSIERS")}</th>
              <th className="uppercase">{t("admin.locataires.col_status", "STATUT")}</th>
              <th className="uppercase text-right">{t("admin.locataires.col_actions", "ACTIONS")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-6 text-slate-400 dark:text-slate-500">{t("forms.loading", "Chargement...")}</td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="text-center py-6 text-rose-500">{error}</td></tr>
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
              <tr><td colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500">{t("admin.locataires.empty", "Aucun locataire trouvé.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
