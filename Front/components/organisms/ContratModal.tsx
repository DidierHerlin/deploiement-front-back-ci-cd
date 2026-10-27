import { useState } from 'react'
import { X, FileText, Calendar, Building2, User, CreditCard } from 'lucide-react'
import { Contrat, Paiement } from '@/lib/api'
import { Pagination } from "@/components/molecules/pagination"
import { useTranslation } from '@/lib/i18n'

type ContratModalProps = {
  contrat: Contrat
  paiements: Paiement[]
  onClose: () => void
  onAction: (action: 'resilier' | 'terminer' | 'finaliser_vente') => void
}

export function ContratModal({ contrat, paiements, onClose, onAction }: ContratModalProps) {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(paiements.length / ITEMS_PER_PAGE);
  const paginatedData = paiements.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  const formatCurrency = (val: any) => {
    if (val === null || val === undefined) return '-'
    return `${Number(val).toLocaleString('fr-FR')} Ar`
  }
  
  const formatDate = (d: string) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  const isLocation = contrat.type_contrat === 'LOCATION'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="presentation">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col" 
        role="dialog" 
        aria-modal="true"
      >
        <button 
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
          onClick={onClose} 
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>
        
        <div className="flex-shrink-0 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
            <FileText size={20} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t("admin.contrats.modal_details_title", "Détails du contrat")} #{contrat.id}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("forms.status", "Statut")} : <span className="font-semibold text-slate-700 dark:text-slate-300">{contrat.statut}</span> • {t("admin.contrats.created_on", "Créé le")} {formatDate(contrat.date_creation)}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                <Building2 size={14} /> {t("admin.contrats.property_concerned", "Bien concerné")}
              </h3>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{contrat.bien_titre}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("forms.property_type", "Type")} : {contrat.bien_type}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                <User size={14} /> {t("admin.contrats.col_tenant", "Locataire / Acheteur")}
              </h3>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{contrat.locataire_prenoms} {contrat.locataire_nom}</p>
            </div>

            <div className={`bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 ${isLocation ? '' : 'md:col-span-2'}`}>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                <CreditCard size={14} /> {t("admin.contrats.financial_terms", "Conditions Financières")}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {isLocation ? (
                  <>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">{t("forms.monthly_rent", "Loyer mensuel")}</span>
                      <strong className="block text-slate-900 dark:text-white mt-0.5">{formatCurrency(contrat.loyer)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">{t("locataire_pages.contrat.card_deposit", "Dépôt de garantie")}</span>
                      <strong className="block text-slate-900 dark:text-white mt-0.5">{formatCurrency(contrat.depot_garantie)}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">{t("forms.sale_price", "Prix de vente")}</span>
                      <strong className="block text-slate-900 dark:text-white mt-0.5">{formatCurrency(contrat.prix)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">{t("admin.contrats.payment_mode_label", "Modalité")}</span>
                      <strong className="block text-slate-900 dark:text-white mt-0.5">{contrat.type_paiement_achat}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isLocation && (
              <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                  <Calendar size={14} /> {t("admin.contrats.col_period", "Période")}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">{t("admin.contrats.col_start_date", "Date de début")}</span>
                    <strong className="block text-slate-900 dark:text-white mt-0.5">{formatDate(contrat.date_debut)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">{t("admin.contrats.end_date", "Date de fin")}</span>
                    <strong className="block text-slate-900 dark:text-white mt-0.5">{formatDate(contrat.date_fin)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3 mt-4">
              {t("admin.contrats.schedule_payments", "Échéancier & Paiements")}
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin.reservations.col_date", "DATE")}</th>
                    <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin.paiements.col_amount", "MONTANT")}</th>
                    <th className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{t("admin.contrats.col_status", "STATUT")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? paginatedData.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="text-xs text-slate-600 dark:text-slate-300">{formatDate(p.date_paiement_prevue || p.date_echeance)}</td>
                      <td className="text-xs font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(p.montant_attendu || p.montant)}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.statut === 'PAYE' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30' 
                            : p.statut === 'EN_RETARD'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
                        }`}>
                          {p.statut}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-slate-500 dark:text-slate-400 italic text-xs">
                        {t("admin.contrats.no_payments_associated", "Aucun paiement associé.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {contrat.statut === 'ACTIF' && isLocation && (
              <>
                <button 
                  className="px-3.5 py-2 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors" 
                  onClick={() => onAction('resilier')}
                >
                  {t("admin.contrats.terminate_action_btn", "Résilier")}
                </button>
                <button 
                  className="px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors" 
                  onClick={() => onAction('terminer')}
                >
                  {t("admin.contrats.end_lease_title", "Terminer le bail")}
                </button>
              </>
            )}
            {(contrat.statut === 'ACTIF' || contrat.statut === 'RESERVE') && !isLocation && (
              <button 
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors" 
                onClick={() => onAction('finaliser_vente')}
              >
                {t("admin.contrats.finalize_sale_title", "Finaliser Vente")}
              </button>
            )}
          </div>
          <button 
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors" 
            onClick={onClose}
          >
            {t("forms.close", "Fermer")}
          </button>
        </div>
      </div>
    </div>
  )
}
