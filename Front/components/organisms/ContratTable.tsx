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
      <div className="table-wrap flex-1">
        <table>
          <thead>
            <tr>
              <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin.biens.col_id", "ID")}</th>
              <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin.contrats.col_property", "BIEN ASSOCIÉ")}</th>
              <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin.contrats.col_tenant", "LOCATAIRE / ACQUÉREUR")}</th>
              <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin.contrats.col_type", "TYPE DE CONTRAT")}</th>
              <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin.paiements.col_amount", "MONTANT")}</th>
              <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin.contrats.col_status", "STATUT")}</th>
              <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">{t("admin.contrats.col_actions", "ACTIONS")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-500 dark:text-slate-400">
                  {t("forms.loading", "Chargement...")}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-rose-500 dark:text-rose-400">
                  {error}
                </td>
              </tr>
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
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400 italic">
                  {t("admin.contrats.empty", "Aucun contrat trouvé.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
