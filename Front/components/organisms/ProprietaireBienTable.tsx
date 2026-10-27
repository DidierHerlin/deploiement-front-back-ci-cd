import { useState } from 'react'
import { Bien } from '@/lib/api'
import { Plus, X } from 'lucide-react'
import { Pagination } from "@/components/molecules/pagination"
import { useTranslation } from '@/lib/i18n'

type ProprietaireBienTableProps = {
  biens: Bien[]
  onClose: () => void
  onAssignClick: () => void
}

export function ProprietaireBienTable({ biens, onClose, onAssignClick }: ProprietaireBienTableProps) {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5
  const totalPages = Math.ceil(biens.length / ITEMS_PER_PAGE)
  const paginatedData = biens.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const formatStatut = (statut: string) => {
    switch (statut) {
      case 'DISPONIBLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
            <i className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t("dashboard.common.status_disponible", "Disponible")}
          </span>
        )
      case 'RESERVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30">
            <i className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t("dashboard.common.status_reserve", "Réservé")}
          </span>
        )
      case 'LOUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border dark:border-blue-500/30">
            <i className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {t("dashboard.common.status_loue", "Loué")}
          </span>
        )
      case 'VENDU':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <i className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {t("dashboard.common.status_vendu", "Vendu")}
          </span>
        )
      case 'EN_TRAVAUX':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border dark:border-rose-500/30">
            <i className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {t("dashboard.common.status_en_travaux", "En travaux")}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <i className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {statut}
          </span>
        )
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section 
        className="w-full max-w-[800px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto" 
        role="dialog" 
        aria-modal="true"
      >
        <button 
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer" 
          onClick={onClose} 
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>
        
        <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">
          {t("admin.proprietaires.associated_properties_title", "Biens immobiliers associés")}
        </h2>
        
        <div className="my-5 flex justify-end">
          <button className="primary-button flex items-center gap-2" onClick={onAssignClick}>
            <Plus size={16} /> {t("admin.proprietaires.assign_existing_property_btn", "Associer un bien existant")}
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("admin.biens.col_id", "RÉF")}</th>
                <th>{t("forms.property_title", "TITRE")}</th>
                <th>{t("admin.biens.type_operation", "TYPE / OPÉRATION")}</th>
                <th>{t("forms.status", "STATUT")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? paginatedData.map(bien => (
                <tr key={bien.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">#{bien.id}</span>
                  </td>
                  <td>
                    <strong className="text-slate-900 dark:text-slate-100 block">{bien.titre}</strong>
                    <small className="block text-slate-500 dark:text-slate-400 text-xs mt-0.5">{bien.adresse}</small>
                  </td>
                  <td className="text-slate-600 dark:text-slate-300 text-xs">
                    {bien.type} • {bien.mode_transaction}
                  </td>
                  <td>{formatStatut(bien.statut)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-400 dark:text-slate-500">
                    {t("admin.proprietaires.no_properties_associated", "Aucun bien associé à ce propriétaire.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button 
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
            onClick={onClose}
          >
            {t("forms.close", "Fermer")}
          </button>
        </div>
      </section>
    </div>
  )
}
