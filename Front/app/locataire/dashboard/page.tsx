'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { getProfil } from '@/lib/api'
import { usePaiements } from '../paiements/hooks/usePaiements'
import { useContrats } from '../contrat/hooks/useContrats'

import { LocataireSidebar } from "@/components/organisms/LocataireSidebar"
import { LocataireTopbar } from "@/components/organisms/LocataireTopbar"
import { ProfileModal } from "@/components/organisms/ProfileModal"

import { DashboardWelcome } from "@/components/organisms/DashboardWelcome"
import { DashboardStats } from "@/components/molecules/DashboardStats"
import { DashboardContratCard } from "@/components/molecules/DashboardContratCard"
import { DashboardProchaineEcheanceCard } from "@/components/molecules/DashboardProchaineEcheanceCard"
import { DashboardPaiementsRecents } from "@/components/organisms/DashboardPaiementsRecents"
import { DashboardDocumentsCard } from "@/components/molecules/DashboardDocumentsCard"
import { NotificationList } from "@/components/organisms/NotificationList"

export default function LocataireDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const active = "Tableau de bord";

  // Récupération dynamique via nos hooks
  const { paiements, notifications, loading: loadingPaiements, error: errorPaiements } = usePaiements();
  const { contrats, loading: loadingContrats, error: errorContrats } = useContrats();

  useEffect(() => {
    getProfil().then(setUser).catch(console.error);
  }, []);

  // Déduire le contrat actif
  const contratActif = contrats.find(c => c.type_contrat === 'LOCATION' && (c.statut === 'ACTIF' || c.statut === 'EN_ATTENTE')) || null;

  return (
    <div className="app-shell">
      <LocataireSidebar 
        mobileNav={mobileNav} 
        setMobileNav={setMobileNav} 
        activeHref="/locataire/dashboard" 
        user={user} 
      />

      <main className="main-content">
        <LocataireTopbar 
          setMobileNav={setMobileNav}
          setShowProfile={setShowProfile}
          activeLabel={active}
          user={user}
        />
        
        <div className="page-body">
          <DashboardWelcome user={user} setShowProfile={setShowProfile} />
          
          <DashboardStats 
            paiements={paiements} 
            contratActif={contratActif} 
            loading={loadingPaiements || loadingContrats} 
            error={errorPaiements || errorContrats} 
          />
          
          <div className="content-grid">
            <DashboardContratCard 
              contrat={contratActif} 
              loading={loadingContrats} 
              error={errorContrats} 
            />
            
            <DashboardProchaineEcheanceCard 
              paiements={paiements} 
              contratActif={contratActif} 
            />
          </div>
          
          <DashboardPaiementsRecents 
            paiements={paiements} 
            contratActif={contratActif} 
          />
          
          <div className="lower-grid">
            <section className="panel notifications-section">
              <div className="panel-header">
                <div><h2>Mes notifications</h2><p>Les informations importantes concernant votre dossier</p></div>
              </div>
              <NotificationList notifications={notifications} />
              {notifications.length === 0 && (
                <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Aucune notification récente.</div>
              )}
            </section>
            
            <DashboardDocumentsCard 
              contrat={contratActif} 
              paiements={paiements} 
            />
          </div>
        </div>
      </main>

      {showProfile && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onProfileUpdated={(res) => setUser(res.user)}
        />
      )}
    </div>
  );
}
