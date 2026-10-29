'use client'

import '@/app/admin/admin.css'
import { useState, useEffect, useMemo } from 'react'
import { getProfil, Paiement } from '@/lib/api'
import { Smartphone, Receipt, PlusCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

import { LocataireSidebar } from "@/components/organisms/LocataireSidebar"
import { LocataireTopbar } from "@/components/organisms/LocataireTopbar"
import { ProfileModal } from "@/components/organisms/ProfileModal"

import { PaiementHeader } from "@/components/organisms/PaiementHeader"
import { PaiementStats } from "@/components/molecules/paiement_PaiementStats"
import { PaiementList } from "@/components/organisms/paiements_PaiementList"
import { NotificationList } from "@/components/organisms/NotificationList"
import { DemandePaiementModal } from "@/components/organisms/DemandePaiementModal"
import { DemandesPaiementList } from "@/components/organisms/DemandesPaiementList"
import { usePaiements } from './hooks/usePaiements'
import { useContrats } from '../contrat/hooks/useContrats'

export default function PaiementsPage() {
  const { t, lang } = useTranslation();
  const [mobileNav, setMobileNav] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'factures' | 'demandes'>('factures');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFactureForModal, setSelectedFactureForModal] = useState<Paiement | null>(null);

  useEffect(() => {
    getProfil().then(setUser).catch(console.error);
  }, []);

  const { paiements, stats, demandes, facturesEligibles, notifications, loading, error, refetch } = usePaiements(user?.id);
  const { contrats } = useContrats();

  // Filtrage des paiements pour masquer ceux dont le contrat est résilié
  const isContratResilie = (p: Paiement): boolean => {
    const directStatut = (p as any).contrat_statut;
    if (typeof directStatut === 'string') {
      const s = directStatut.trim().toUpperCase();
      if (s === 'RESILIE' || s === 'RÉSILIÉ') return true;
    }
    if (typeof p.contrat === 'object' && p.contrat !== null) {
      const s = (p.contrat as any).statut;
      if (typeof s === 'string') {
        const sUpper = s.trim().toUpperCase();
        if (sUpper === 'RESILIE' || sUpper === 'RÉSILIÉ') return true;
      }
    }
    const contratId = typeof p.contrat === 'object' && p.contrat !== null ? (p.contrat as any).id : p.contrat;
    if (contratId && contrats && contrats.length > 0) {
      const c = contrats.find(contrat => contrat.id === contratId);
      if (c?.statut) {
        const sUpper = c.statut.trim().toUpperCase();
        if (sUpper === 'RESILIE' || sUpper === 'RÉSILIÉ') return true;
      }
    }
    return false;
  };

  const paiementsNonResilies = useMemo(() => {
    return paiements.filter(p => !isContratResilie(p));
  }, [paiements, contrats]);

  const handleOpenDemande = (facture?: Paiement) => {
    setSelectedFactureForModal(facture || (facturesEligibles.length > 0 ? facturesEligibles[0] : null));
    setIsModalOpen(true);
  };

  const handleDemandeSuccess = () => {
    refetch();
  };

  const pendingDemandesCount = demandes.filter(d => d.statut === 'EN_ATTENTE').length;

  return (
    <div className="app-shell">
      <LocataireSidebar 
        mobileNav={mobileNav} 
        setMobileNav={setMobileNav} 
        activeHref="/locataire/paiements" 
        user={user} 
      />

      <main className="main-content">
        <LocataireTopbar 
          setMobileNav={setMobileNav}
          setShowProfile={setShowProfile}
          activeLabel={t('dashboard.nav.my_payments', 'Mes paiements')}
          user={user}
        />
        
        <div className="page-body">
          <PaiementHeader />

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p>{t('forms.loading', 'Chargement de vos paiements...')}</p>
            </div>
          ) : error ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}>
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Bannière d'incitation si facture du mois à venir disponible */}
              {facturesEligibles.length > 0 && (() => {
                const invoice = facturesEligibles[0];
                const period = invoice.date_echeance 
                  ? new Date(invoice.date_echeance).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' }) 
                  : (lang === 'en' ? 'this month' : 'ce mois');
                const amount = parseFloat((invoice.montant_attendu || invoice.montant || 0) as string).toLocaleString('fr-FR');
                const descText = lang === 'en'
                  ? `Your priority due rent for ${period} (${amount} Ar) can be paid immediately via MVola, Orange Money, or Airtel Money.`
                  : `Votre échéance prioritaire pour ${period} (${amount} Ar) est prête à être réglée exclusivement par MVola, Orange Money ou Airtel Money.`;

                return (
                  <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                        <Smartphone size={22} />
                      </div>
                      <div>
                        <h3 className="m-0 mb-1 text-sm sm:text-base font-bold text-blue-950 dark:text-blue-100">
                          {t('locataire_pages.paiements.eligible_title', 'Facture en attente prête pour règlement Mobile Money')}
                        </h3>
                        <p className="m-0 text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                          {descText}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenDemande(invoice)}
                      className="primary-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 border-0"
                    >
                      <Smartphone size={16} /> {t('locataire_pages.paiements.request_payment_btn', 'Demander le paiement Mobile Money')}
                    </button>
                  </div>
                );
              })()}

              {/* Onglets de navigation */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <button
                  onClick={() => setActiveTab('factures')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'factures'
                      ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Receipt size={16} />
                  <span>{t('locataire_pages.paiements.tab_invoices', 'Factures & Échéances')}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'factures'
                        ? 'bg-blue-500/30 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {paiementsNonResilies.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('demandes')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'demandes'
                      ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Smartphone size={16} />
                  <span>{t('locataire_pages.paiements.tab_requests', 'Mes demandes Mobile Money')}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      pendingDemandesCount > 0
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        : activeTab === 'demandes'
                        ? 'bg-blue-500/30 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {demandes.length}
                    {pendingDemandesCount > 0 && ` (${pendingDemandesCount} en attente)`}
                  </span>
                </button>
              </div>

              {activeTab === 'factures' ? (
                <>
                  <PaiementStats paiements={paiements} user={user} stats={stats} />
                  <PaiementList
                    paiements={paiementsNonResilies}
                    contrats={contrats}
                    onUpdate={refetch}
                    onDemanderPaiement={(facture) => handleOpenDemande(facture)}
                  />
                  <NotificationList notifications={notifications} />
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {facturesEligibles.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenDemande(facturesEligibles[0])}
                        className="primary-button"
                        style={{
                          backgroundColor: '#2563eb',
                          color: 'white',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontWeight: 650,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          border: 'none',
                        }}
                      >
                        <PlusCircle size={16} /> {t('locataire_pages.paiements.new_request_btn', 'Nouvelle demande Mobile Money')}
                      </button>
                    </div>
                  )}
                  <DemandesPaiementList
                    demandes={demandes}
                    onDemandeCancelled={refetch}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de demande de paiement */}
      <DemandePaiementModal
        isOpen={isModalOpen}
        facture={selectedFactureForModal}
        facturesEligibles={facturesEligibles}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFactureForModal(null);
        }}
        onSuccess={handleDemandeSuccess}
      />

      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
