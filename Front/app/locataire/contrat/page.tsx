'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { getProfil, Contrat } from '@/lib/api'

import { LocataireSidebar } from '../components/LocataireSidebar'
import { LocataireTopbar } from '../components/LocataireTopbar'
import { ProfileModal } from '../components/ProfileModal'

import { ContratHeader } from './components/ContratHeader'
import { ContratList } from './components/ContratList'
import { ContratDetails } from './components/ContratDetails'
import { useContrats } from './hooks/useContrats'

export default function ContratPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<Contrat | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getProfil().then(setUser).catch(console.error);
  }, []);

  const { contrats, loading, error } = useContrats();

  return (
    <div className="app-shell">
      <LocataireSidebar 
        mobileNav={mobileNav} 
        setMobileNav={setMobileNav} 
        activeHref="/locataire/contrat" 
        user={user} 
      />

      <main className="main-content">
        <LocataireTopbar 
          setMobileNav={setMobileNav}
          setShowProfile={setShowProfile}
          activeLabel="Mes contrats"
          user={user}
        />
        
        <div className="page-body">
          <ContratHeader />

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p>Chargement de vos contrats...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <ContratList contrats={contrats} onViewDetails={setSelectedContrat} />
              </div>
            </>
          )}
        </div>
      </main>

      {selectedContrat && (
        <ContratDetails contrat={selectedContrat} onClose={() => setSelectedContrat(null)} />
      )}

      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
