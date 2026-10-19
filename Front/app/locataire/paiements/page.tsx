'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { getProfil, Paiement } from '@/lib/api'
import { Smartphone, Receipt, ListFilter, AlertCircle, Clock, PlusCircle } from 'lucide-react'

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

export default function PaiementsPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'factures' | 'demandes'>('factures');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFactureForModal, setSelectedFactureForModal] = useState<Paiement | null>(null);

  useEffect(() => {
    getProfil().then(setUser).catch(console.error);
  }, []);

  const { paiements, demandes, facturesEligibles, notifications, loading, error, refetch } = usePaiements();

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
          activeLabel="Mes paiements"
          user={user}
        />
        
        <div className="page-body">
          <PaiementHeader />

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p>Chargement de vos paiements...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}>
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Bannière d'incitation si facture du mois à venir disponible */}
              {facturesEligibles.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#dbeafe',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Smartphone size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
                        Facture en attente prête pour règlement Mobile Money
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.86rem', color: '#3b82f6' }}>
                        Votre échéance prioritaire pour <strong>{facturesEligibles[0].date_echeance ? new Date(facturesEligibles[0].date_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'ce mois'}</strong> ({parseFloat((facturesEligibles[0].montant_attendu || facturesEligibles[0].montant || 0) as string).toLocaleString('fr-FR')} Ar) est prête à être réglée exclusivement par MVola, Orange Money ou Airtel Money.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDemande(facturesEligibles[0])}
                    className="primary-button"
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '10px 18px',
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
                    <Smartphone size={16} /> Demander le paiement Mobile Money
                  </button>
                </div>
              )}

              {/* Onglets de navigation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '1.5rem',
                }}
              >
                <button
                  onClick={() => setActiveTab('factures')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: activeTab === 'factures' ? 700 : 500,
                    color: activeTab === 'factures' ? '#2563eb' : '#64748b',
                    borderBottom: activeTab === 'factures' ? '2px solid #2563eb' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  <Receipt size={17} /> Factures & Échéances
                  <span
                    style={{
                      fontSize: '0.75rem',
                      backgroundColor: activeTab === 'factures' ? '#dbeafe' : '#f1f5f9',
                      color: activeTab === 'factures' ? '#1d4ed8' : '#64748b',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}
                  >
                    {paiements.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('demandes')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: activeTab === 'demandes' ? 700 : 500,
                    color: activeTab === 'demandes' ? '#2563eb' : '#64748b',
                    borderBottom: activeTab === 'demandes' ? '2px solid #2563eb' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  <Smartphone size={17} /> Mes demandes Mobile Money
                  <span
                    style={{
                      fontSize: '0.75rem',
                      backgroundColor: pendingDemandesCount > 0 ? '#fef3c7' : activeTab === 'demandes' ? '#dbeafe' : '#f1f5f9',
                      color: pendingDemandesCount > 0 ? '#b45309' : activeTab === 'demandes' ? '#1d4ed8' : '#64748b',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}
                  >
                    {demandes.length} {pendingDemandesCount > 0 && `(${pendingDemandesCount} en attente)`}
                  </span>
                </button>
              </div>

              {activeTab === 'factures' ? (
                <>
                  <PaiementStats paiements={paiements} />
                  <PaiementList
                    paiements={paiements}
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
                        <PlusCircle size={16} /> Nouvelle demande Mobile Money
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
