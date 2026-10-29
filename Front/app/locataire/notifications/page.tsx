'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { getProfil } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { LocataireSidebar } from '@/components/organisms/LocataireSidebar'
import { LocataireTopbar } from '@/components/organisms/LocataireTopbar'
import { ProfileModal } from '@/components/organisms/ProfileModal'
import { NotificationsPageView } from '@/components/organisms/NotificationsPageView'

export default function LocataireNotificationsPage() {
  const { t } = useTranslation()
  const [user, setUser] = useState<any>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const active = t('dashboard.nav.notifications', 'Notifications')

  useEffect(() => {
    getProfil().then(setUser).catch(console.error)
  }, [])

  return (
    <div className="app-shell">
      <LocataireSidebar
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        activeHref="/locataire/notifications"
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
          <NotificationsPageView role="LOCATAIRE" />
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
