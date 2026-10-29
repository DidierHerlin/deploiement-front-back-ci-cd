"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, FileText, WalletCards, Settings, CircleDollarSign, MoreHorizontal, X, ChevronDown, Menu, ChevronRight, Bell, User, CheckCheck } from 'lucide-react'
import { deconnecter } from '@/lib/auth'
import { getProfil, UserProfil, getNotifications, markNotificationsAsRead, Notification } from '@/lib/api'
import { useTranslation, LanguageSwitcher } from '@/lib/i18n'
import { ThemeToggle } from '@/components/molecules/ThemeToggle'
import '@/proprietaire/styles/dashboard.css'

const navItems = [
  { label: 'Vue d’ensemble', icon: Home, path: '/proprietaire/dashboard' },
  { label: 'Mes biens', icon: Building2, path: '/proprietaire/biens' },
  { label: 'Mes contrats', icon: FileText, path: '/proprietaire/contrats' },
  { label: 'Mes paiements', icon: WalletCards, path: '/proprietaire/paiements' },
  { label: 'Notifications', icon: Bell, path: '/proprietaire/notifications' },
  { label: 'Paramètres', icon: Settings, path: '/proprietaire/parametres' },
  { label: 'Mon Profil', icon: User, path: '/proprietaire/profil' },
]

export function ProprietaireLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = useTranslation()
  const [mobileNav, setMobileNav] = useState(false)
  const pathname = usePathname()
  const [profil, setProfil] = useState<UserProfil | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    getProfil()
      .then(setProfil)
      .catch(err => console.error("Erreur chargement profil", err))
    getNotifications()
      .then(setNotifications)
      .catch(err => console.error("Erreur chargement notifications", err))
  }, [])

  const unreadCount = notifications.filter(n => !n.lu).length
  const handleToggleNotifications = async () => {
    const wasClosed = !notificationsOpen
    setNotificationsOpen(wasClosed)
    if (wasClosed && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.lu).map(n => n.id)
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
      try { await markNotificationsAsRead(unreadIds) } catch (err) { console.error(err) }
    }
  }

  const fullName = profil ? `${profil.prenoms} ${profil.nom}`.trim() : 'Propriétaire'
  const initials = profil ? `${profil.prenoms?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase() || 'P' : 'DH'

  const getNavLabel = (path: string, defaultLabel: string) => {
    switch (path) {
      case '/proprietaire/dashboard':
        return t("dashboard.nav.overview", defaultLabel)
      case '/proprietaire/biens':
        return t("dashboard.nav.my_properties", defaultLabel)
      case '/proprietaire/contrats':
        return t("dashboard.nav.my_contracts", defaultLabel)
      case '/proprietaire/paiements':
        return t("dashboard.nav.my_payments", defaultLabel)
      case '/proprietaire/notifications':
        return t("dashboard.nav.notifications", defaultLabel)
      case '/proprietaire/parametres':
        return t("dashboard.nav.settings", defaultLabel)
      case '/proprietaire/profil':
        return t("dashboard.nav.profile", defaultLabel)
      default:
        return defaultLabel
    }
  }

  return (
    <div className="prop-app-shell">
      <aside className={`prop-sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand">
          <img src="/logo-app.avif" alt="Logo" style={{ height: '32px', width: 'auto' }} />
          <button className="close-nav" onClick={() => setMobileNav(false)}><X size={18} /></button>
        </div>
        <nav className="main-nav" aria-label="Navigation propriétaire">
          {navItems.map(({ label, icon: Icon, path }) => {
            const isActive = pathname === path
            return (
              <Link key={path} href={path} className={isActive ? 'active flex items-center gap-3 text-sm' : 'flex items-center gap-3 text-[#687386] hover:text-[#17202b] hover:bg-[#f4f6fa] p-2 rounded-lg transition-colors text-sm'} onClick={() => setMobileNav(false)}>
                <Icon size={18} /><span>{getNavLabel(path, label)}</span>
                {path === '/proprietaire/paiements' && <b className="ml-auto bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">3</b>}
                {path === '/proprietaire/notifications' && unreadCount > 0 && (
                  <b className="ml-auto bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs">
                    {unreadCount}
                  </b>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={deconnecter} className="w-full mb-4 flex items-center gap-3 !text-red-600 hover:!text-red-700 hover:!bg-red-50 p-2 rounded-lg transition-colors text-sm text-left font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            {t("dashboard.nav.logout", "Se déconnecter")}
          </button>
          <div className="account border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="user-avatar">{initials}</div>
            <div><strong>{fullName}</strong><small>{t("dashboard.roles.PROPRIETAIRE", "Propriétaire")}</small></div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="prop-main-content">
        <header className="prop-topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)}><Menu size={21} /></button>
          <div className="breadcrumbs">
            <span>{t("dashboard.topbar.owner_space", "Mon espace")}</span><ChevronRight size={15} />
            <strong>
              {pathname.includes('notifications')
                ? t("dashboard.nav.notifications", "Notifications")
                : pathname.includes('parametres')
                ? t("dashboard.nav.settings", "Paramètres")
                : pathname.includes('profil')
                ? t("dashboard.nav.profile", "Profil")
                : pathname.includes('biens')
                ? t("dashboard.nav.my_properties", "Mes biens")
                : pathname.includes('contrats')
                ? t("dashboard.nav.my_contracts", "Mes contrats")
                : pathname.includes('paiements')
                ? t("dashboard.nav.my_payments", "Mes paiements")
                : t("dashboard.nav.overview", "Vue d’ensemble")}
            </strong>
          </div>
          <div className="top-actions">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* Notification Bell with Badge and Popover */}
            <div className="notification-wrap" style={{ position: 'relative' }}>
              <button 
                className="icon-button relative flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications" 
                onClick={handleToggleNotifications}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>
              
              {notificationsOpen && (
                <div className="notification-popover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden" style={{ position: 'absolute', top: '100%', right: 0, width: 320, zIndex: 50, marginTop: 8, textAlign: 'left' }}>
                  <div className="popover-head px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex justify-between items-center">
                    <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("dashboard.topbar.notifications", "Alertes")}</strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <CheckCheck size={14} /> {notifications.length} {t("dashboard.topbar.total_alerts", "au total")}
                    </span>
                  </div>
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="py-6 px-4 text-center text-slate-500 dark:text-slate-400 text-xs">{t("dashboard.topbar.no_alerts", "Aucune nouvelle alerte")}</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-slate-100 dark:border-slate-800 transition-colors ${n.lu ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/40 dark:bg-blue-950/20'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 m-0">{n.titre}</p>
                            {!n.lu && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 m-0 line-clamp-2 leading-relaxed">{n.message}</p>
                          <small className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1.5">
                            {new Date(n.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center">
                    <Link
                      href="/proprietaire/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block py-1"
                    >
                      {t("dashboard.topbar.view_all_notifications", "Voir toutes les notifications")} &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/proprietaire/profil" className="top-user flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="user-avatar">{initials}</div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{fullName}</span>
              <ChevronDown size={15} className="text-slate-400 dark:text-slate-500" />
            </Link>
          </div>
        </header>
        <div className="prop-page-body">
          {children}
        </div>
      </main>
    </div>
  )
}
