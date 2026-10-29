'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { getProfil } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { LocataireSidebar } from '@/components/organisms/LocataireSidebar'
import { LocataireTopbar } from '@/components/organisms/LocataireTopbar'
import { ProfileModal } from '@/components/organisms/ProfileModal'
import ProfilView from '@/components/organisms/ProfilView'

export default function LocataireProfilPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [user, setUser] = useState<any>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const active = t('dashboard.nav.profile', 'Mon Profil')

  useEffect(() => {
    getProfil().then(setUser).catch(console.error)
  }, [])

  return (
    <div className="app-shell bg-slate-50 dark:bg-slate-950 min-h-screen">
      <LocataireSidebar
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        activeHref="/locataire/profil"
        user={user}
      />

      <main className="main-content bg-slate-50 dark:bg-slate-950 flex flex-col min-h-screen">
        <LocataireTopbar
          setMobileNav={setMobileNav}
          setShowProfile={setShowProfile}
          activeLabel={active}
          user={user}
        />

        <div className="page-body flex-1 p-4 sm:p-8 flex flex-col items-center">
          <div className="w-full max-w-4xl mb-6 flex justify-start">
            <button
              onClick={() => router.push('/locataire/dashboard')}
              className="flex items-center text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('profile.back_to_dashboard', 'Retour au tableau de bord')}
            </button>
          </div>
          <ProfilView />
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
