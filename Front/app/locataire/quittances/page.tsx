'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { getProfil } from '@/lib/api'
import { usePaiements } from '../paiements/hooks/usePaiements'
import { useContrats } from '../contrat/hooks/useContrats'

import { LocataireSidebar } from '../components/LocataireSidebar'
import { LocataireTopbar } from '../components/LocataireTopbar'
import { ProfileModal } from '../components/ProfileModal'

import { QuittanceList } from './components/QuittanceList'

export default function LocataireQuittancesPage() {
  const [user, setUser] = useState<any>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const active = "Mes quittances";

  const { paiements, loading: loadingPaiements } = usePaiements();
  const { contrats, loading: loadingContrats } = useContrats();

  useEffect(() => {
    getProfil().then(setUser).catch(console.error);
  }, []);

  return (
    <div className="app-shell">
      <LocataireSidebar 
        mobileNav={mobileNav} 
        setMobileNav={setMobileNav} 
        activeHref="/locataire/quittances" 
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
          <QuittanceList 
            paiements={paiements}
            contrats={contrats}
            loading={loadingPaiements || loadingContrats}
          />
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
