'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { getProfil } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { LocataireSidebar } from '@/components/organisms/LocataireSidebar'
import { LocataireTopbar } from '@/components/organisms/LocataireTopbar'
import { ProfileModal } from '@/components/organisms/ProfileModal'
import { ParametresPageView } from '@/components/organisms/ParametresPageView'

export default function LocataireParametresPage() {
  const { t } = useTranslation()
  const [user, setUser] = useState<any>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const active = t('dashboard.nav.settings', 'Paramètres')

  useEffect(() => {
    getProfil().then(setUser).catch(console.error)
  }, [])

  return (
    <div className="app-shell">
      <LocataireSidebar
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        activeHref="/locataire/parametres"
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
          <ParametresPageView role="LOCATAIRE" />
        </div>
      </main>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onProfileUpdated={(updated) => setUser(updated)}
        />
      )}
    </div>
  )
}
