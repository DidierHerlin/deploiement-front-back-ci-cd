'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { getProfil } from '@/lib/api'

import { LocataireSidebar } from "@/components/organisms/LocataireSidebar"
import { LocataireTopbar } from "@/components/organisms/LocataireTopbar"
import { ProfileModal } from "@/components/organisms/ProfileModal"

import { PaiementHeader } from "@/components/organisms/PaiementHeader"
import { PaiementStats } from "@/components/molecules/paiement_PaiementStats"
import { PaiementList } from "@/components/organisms/paiements_PaiementList"
import { NotificationList } from "@/components/organisms/NotificationList"
import { usePaiements } from './hooks/usePaiements'

export default function PaiementsPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getProfil().then(setUser).catch(console.error);
  }, []);

  const { paiements, notifications, loading, error } = usePaiements();

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
              <PaiementStats paiements={paiements} />
              <PaiementList paiements={paiements} />
              <NotificationList notifications={notifications} />
            </>
          )}
        </div>
      </main>

      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
