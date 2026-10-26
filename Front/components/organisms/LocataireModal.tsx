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
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose} aria-label={t("forms.close", "Fermer")}><X size={18} /></button>
        <div className="modal-icon"><User size={20} /></div>
        <h2 style={{ marginBottom: '5px' }}>{t("admin.locataires.sheet_title", "Détails Locataire")}</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>{user?.prenoms} {user?.nom}</p>

        <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <button 
            style={{ padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'infos' ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === 'infos' ? '#4f46e5' : '#666', fontWeight: activeTab === 'infos' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => setActiveTab('infos')}
          ><User size={16} /> {t("profile.general_info", "Informations")}</button>
          
          <button 
            style={{ padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'contrats' ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === 'contrats' ? '#4f46e5' : '#666', fontWeight: activeTab === 'contrats' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => setActiveTab('contrats')}
          ><FileText size={16} /> {t("admin.locataires.leases_properties", "Contrats & Biens")}</button>
          
          <button 
            style={{ padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'paiements' ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === 'paiements' ? '#4f46e5' : '#666', fontWeight: activeTab === 'paiements' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => setActiveTab('paiements')}
          ><CreditCard size={16} /> {t("dashboard.nav.payments", "Paiements")}</button>
        </div>
        
        {activeTab === 'infos' && (
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <small style={{ color: '#586577' }}>{t("profile.full_name", "Nom et prénoms")}</small>
              <p style={{ fontWeight: 500 }}>{user?.prenoms} {user?.nom}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>{t("profile.email", "Email")}</small>
              <p style={{ fontWeight: 500 }}>{user?.email}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>{t("profile.phone", "Téléphone")}</small>
              <p style={{ fontWeight: 500 }}>{user?.telephone || t("profile.not_provided", 'Non renseigné')}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>{t("admin.proprietaires.account_status", "Statut du compte")}</small>
              <p style={{ fontWeight: 500 }}>
                {isActive ? <span style={{ color: '#16a34a' }}>{t("dashboard.common.active", "Actif")}</span> : <span style={{ color: '#dc2626' }}>{t("dashboard.common.inactive", "Désactivé")}</span>}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'contrats' && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("admin.biens.col_id", "RÉF")}</th>
                    <th>{t("admin.contrats.col_property", "BIEN")}</th>
                    <th>{t("admin.contrats.col_type", "TYPE")}</th>
                    <th>{t("admin.contrats.col_period", "PÉRIODE")}</th>
                    <th>{t("locataire_pages.contrat.card_rent", "LOYER")}</th>
                    <th>{t("admin.contrats.col_status", "STATUT")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContrats.length > 0 ? paginatedContrats.map(c => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Building2 size={14} style={{ color: '#888' }} /> <strong>{c.bien_titre}</strong></div>
                      </td>
                      <td>{c.type_contrat}</td>
                      <td><small>{c.date_debut} au {c.date_fin || t("dashboard.common.undefined", 'Indéfini')}</small></td>
                      <td><strong>{formatCurrency(c.loyer || c.prix)}</strong></td>
                      <td><span className="role-badge">{c.statut}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>{t("admin.locataires.no_contract_associated", "Aucun contrat associé.")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPageContrats} totalPages={totalPagesContrats} onPageChange={setCurrentPageContrats} />
          </>
        )}

        {activeTab === 'paiements' && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("admin.reservations.col_date", "DATE")}</th>
                    <th>{t("dashboard.nav.contracts", "CONTRAT")}</th>
                    <th>{t("admin.paiements.col_amount", "MONTANT")}</th>
                    <th>{t("admin.paiements.col_status", "STATUT")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPaiements.length > 0 ? paginatedPaiements.map(p => (
                    <tr key={p.id}>
                      <td>{p.date_paiement || p.date_paiement_prevue}</td>
                      <td>#{p.contrat}</td>
                      <td><strong>{formatCurrency(p.montant_paye || p.montant_attendu)}</strong></td>
                      <td>
                        <span className={`status ${p.statut === 'VALIDE' ? 'paid' : p.statut === 'EN_ATTENTE' ? 'pending' : 'disabled'}`}>
                          <i />{p.statut}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>{t("admin.locataires.no_payment_history", "Aucun historique de paiement.")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPagePaiements} totalPages={totalPagesPaiements} onPageChange={setCurrentPagePaiements} />
          </>
        )}

        <div className="modal-actions" style={{ marginTop: '30px' }}>
          <button className="outline-button" onClick={onClose}>{t("forms.close", "Fermer")}</button>
        </div>
      </section>
    </div>
  )
}
