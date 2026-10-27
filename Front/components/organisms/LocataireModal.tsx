import { X, User, FileText, Building2, CreditCard } from 'lucide-react'
import { Locataire, Contrat, Paiement } from '@/lib/api'
import { useState } from 'react'
import { Pagination } from "@/components/molecules/pagination"
import { useTranslation } from '@/lib/i18n'

type LocataireModalProps = {
  locataire: Locataire
  contrats: Contrat[]
  paiements: Paiement[]
  onClose: () => void
}

export function LocataireModal({ locataire, contrats, paiements, onClose }: LocataireModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'infos' | 'contrats' | 'paiements'>('infos')
  
  const [currentPageContrats, setCurrentPageContrats] = useState(1);
  const [currentPagePaiements, setCurrentPagePaiements] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const totalPagesContrats = Math.ceil(contrats.length / ITEMS_PER_PAGE);
  const paginatedContrats = contrats.slice((currentPageContrats - 1) * ITEMS_PER_PAGE, currentPageContrats * ITEMS_PER_PAGE);

  const totalPagesPaiements = Math.ceil(paiements.length / ITEMS_PER_PAGE);
  const paginatedPaiements = paiements.slice((currentPagePaiements - 1) * ITEMS_PER_PAGE, currentPagePaiements * ITEMS_PER_PAGE);

  const user = locataire.user
  const isActive = user?.is_active ?? true

  const formatCurrency = (val: any) => {
    if (!val) return 'N/A'
    return `${Number(val).toLocaleString('fr-FR')} Ar`
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
        
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/20">
          <User size={20} />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">
          {t("admin.locataires.sheet_title", "Détails Locataire")}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {user?.prenoms} {user?.nom}
        </p>

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-5">
          <button 
            type="button"
            className={`px-3 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'infos' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('infos')}
          >
            <User size={16} /> {t("profile.general_info", "Informations")}
          </button>
          
          <button 
            type="button"
            className={`px-3 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'contrats' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('contrats')}
          >
            <FileText size={16} /> {t("admin.locataires.leases_properties", "Contrats & Biens")}
          </button>
          
          <button 
            type="button"
            className={`px-3 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'paiements' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('paiements')}
          >
            <CreditCard size={16} /> {t("dashboard.nav.payments", "Paiements")}
          </button>
        </div>
        
        {activeTab === 'infos' && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.full_name", "Nom et prénoms :")}</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium text-right">{user?.prenoms} {user?.nom}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.email", "Email :")}</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium text-right">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 font-normal">{t("profile.phone", "Téléphone :")}</span>
              <span className={`font-medium text-right ${user?.telephone ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                {user?.telephone || t("profile.not_provided", 'Non renseigné')}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-normal">{t("admin.proprietaires.account_status", "Statut du compte :")}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isActive ? t("dashboard.common.active", "Actif") : t("dashboard.common.inactive", "Désactivé")}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'contrats' && (
          <div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="uppercase">{t("admin.biens.col_id", "RÉF")}</th>
                    <th className="uppercase">{t("admin.contrats.col_property", "BIEN")}</th>
                    <th className="uppercase">{t("admin.contrats.col_type", "TYPE")}</th>
                    <th className="uppercase">{t("admin.contrats.col_period", "PÉRIODE")}</th>
                    <th className="uppercase">{t("locataire_pages.contrat.card_rent", "LOYER")}</th>
                    <th className="uppercase">{t("admin.contrats.col_status", "STATUT")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContrats.length > 0 ? paginatedContrats.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td><span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">#{c.id}</span></td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-slate-400 shrink-0" />
                          <strong className="text-slate-900 dark:text-slate-100">{c.bien_titre}</strong>
                        </div>
                      </td>
                      <td className="text-slate-600 dark:text-slate-300">{c.type_contrat}</td>
                      <td><small className="text-slate-500 dark:text-slate-400">{c.date_debut} au {c.date_fin || t("dashboard.common.undefined", 'Indéfini')}</small></td>
                      <td><strong className="text-slate-900 dark:text-slate-100">{formatCurrency(c.loyer || c.prix)}</strong></td>
                      <td><span className="role-badge dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700">{c.statut}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-400 dark:text-slate-500">{t("admin.locataires.no_contract_associated", "Aucun contrat associé.")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPageContrats} totalPages={totalPagesContrats} onPageChange={setCurrentPageContrats} />
          </div>
        )}

        {activeTab === 'paiements' && (
          <div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="uppercase">{t("admin.reservations.col_date", "DATE")}</th>
                    <th className="uppercase">{t("dashboard.nav.contracts", "CONTRAT")}</th>
                    <th className="uppercase">{t("admin.paiements.col_amount", "MONTANT")}</th>
                    <th className="uppercase">{t("admin.paiements.col_status", "STATUT")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPaiements.length > 0 ? paginatedPaiements.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="text-slate-700 dark:text-slate-300">{p.date_paiement || p.date_paiement_prevue}</td>
                      <td className="text-slate-900 dark:text-slate-100 font-medium">#{p.contrat}</td>
                      <td><strong className="text-slate-900 dark:text-slate-100">{formatCurrency(p.montant_paye || p.montant_attendu)}</strong></td>
                      <td>
                        <span className={`status ${
                          p.statut === 'VALIDE' 
                            ? 'paid dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30' 
                            : p.statut === 'EN_ATTENTE' 
                            ? 'pending dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30' 
                            : 'disabled dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700'
                        }`}>
                          <i />{p.statut}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="text-center py-6 text-slate-400 dark:text-slate-500">{t("admin.locataires.no_payment_history", "Aucun historique de paiement.")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPagePaiements} totalPages={totalPagesPaiements} onPageChange={setCurrentPagePaiements} />
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button 
            type="button" 
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
