'use client'

import { useState, useEffect } from 'react'
import { getNotifications, markNotificationsAsRead, Notification } from '@/lib/api'
import { CheckCheck } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, ChevronDown, ChevronRight, Home, Menu, MoreHorizontal, Search, Settings, ShieldCheck, X, LogOut
} from 'lucide-react'
import { deconnecter } from '@/lib/auth'
import { useTranslation, LanguageSwitcher } from '@/lib/i18n'
import { ThemeToggle } from '@/components/molecules/ThemeToggle'
import '@/app/admin/admin.css' // We use the admin CSS because the user wants EXACTLY the same styles

export type NavItem = {
  label: string
  icon: React.ElementType
  href: string
  badge?: string
}

export type NavbarProps = {
  children: React.ReactNode
  navItems: NavItem[]
  workspaceName?: string
  workspaceRole?: string
  workspaceInitials?: string
  userName?: string
  userRole?: string
  userInitials?: string
}

export default function Navbar({ 
  children,
  navItems,
  workspaceName = "Tableau de bord",
  workspaceRole = "Accès plateforme",
  workspaceInitials = "TB",
  userName = "Utilisateur",
  userRole = "Membre",
  userInitials = "U"
}: NavbarProps) {
  const { t, lang } = useTranslation()
  const [mobileNav, setMobileNav] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const pathname = usePathname()

  const [notifications, setNotifications] = useState<Notification[]>([])
  useEffect(() => { getNotifications().then(setNotifications).catch(console.error) }, [])
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

  const getNavLabel = (item: NavItem) => {
    switch (item.href) {
      case '/admin/dashboard':
      case '/agent/dashboard':
      case '/dashboard':
        return t("dashboard.nav.overview", item.label)
      case '/admin/utilisateur':
        return t("dashboard.nav.users", item.label)
      case '/admin/bien':
      case '/agent/biens':
      case '/dashboard/biens':
        return t("dashboard.nav.properties", item.label)
      case '/admin/proprietaire':
        return t("dashboard.nav.owners", item.label)
      case '/admin/locataire':
      case '/agent/locataires':
      case '/dashboard/locataires':
        return t("dashboard.nav.tenants", item.label)
      case '/admin/reservation':
      case '/agent/reservations':
        return t("dashboard.nav.reservations", item.label)
      case '/admin/contrat':
      case '/dashboard/contrats':
        return t("dashboard.nav.contracts", item.label)
      case '/agent/contrats':
        return t("dashboard.nav.leases", item.label)
      case '/admin/paiement':
        return t("dashboard.nav.payments", item.label)
      case '/agent/paiements':
        return t("dashboard.nav.finances", item.label)
      case '/admin/reporting':
      case '/dashboard/reporting':
        return t("dashboard.nav.reporting", item.label)
      case '/admin/parametres':
      case '/agent/parametres':
      case '/dashboard/parametres':
        return t("dashboard.nav.settings", item.label)
      case '/agent/profil':
        return t("dashboard.nav.profile", item.label)
      default:
        return item.label
    }
  }

  const currentNav = navItems.find(item => item.href === pathname || (item.href !== '#' && pathname.startsWith(item.href)))
  const activeLabel = currentNav ? getNavLabel(currentNav) : (pathname === '/admin/parametres' ? t("dashboard.nav.settings", "Paramètres") : t("dashboard.nav.overview", "Vue d’ensemble"))

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand">
          <img src="/logo-app.avif" alt="Logo" style={{ height: '32px', width: 'auto' }} />
          <button className="close-nav" onClick={() => setMobileNav(false)}><X size={18} /></button>
        </div>
        
        <div className="workspace">
          <div className="workspace-avatar admin-avatar">{workspaceInitials}</div>
          <div><strong>{workspaceName}</strong><small>{workspaceRole}</small></div>
          <ChevronDown size={15} />
        </div>
        
        <nav className="main-nav" aria-label="Navigation">
          {navItems.map((item) => {
            const { icon: Icon, badge, href } = item
            const label = getNavLabel(item)
            const isActive = pathname === href || (href !== '#' && pathname.startsWith(href) && href !== '/dashboard')
            return (
              <Link key={href} href={href} className={isActive ? 'active' : ''} onClick={() => setMobileNav(false)}>
                <Icon size={18} /><span>{label}</span>{badge && <b>{badge === 'Nouveau' ? t("dashboard.nav.new_badge", badge) : badge}</b>}
              </Link>
            )
          })}
        </nav>
        
        <div className="sidebar-bottom">
          <button onClick={deconnecter} style={{ color: '#ef4444' }}><LogOut size={18} />{t("dashboard.nav.logout", "Déconnexion")}</button>
          <div className="account">
            <div className="user-avatar">{userInitials}</div>
            <div><strong>{userName}</strong><small>{userRole}</small></div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)}>
            <Menu size={21} />
          </button>
          <div className="breadcrumbs">
            <span>{workspaceName}</span><ChevronRight size={15} />
            <strong>{activeLabel}</strong>
          </div>
          <div className="top-actions">
            <div className="search-box">
              <Search size={17} />
              <input aria-label="Rechercher" placeholder={t("dashboard.topbar.search_placeholder", "Rechercher...")} value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            
            <ThemeToggle />
            <LanguageSwitcher />

            <div className="notification-wrap" style={{ position: 'relative' }}>
              <button className="icon-button" aria-label="Notifications" onClick={handleToggleNotifications}>
                <Bell size={19} />
                {unreadCount > 0 && <i style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />}
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
                      <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">{t("dashboard.topbar.no_alerts", "Aucune nouvelle")}</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-slate-100 dark:border-slate-800 transition-colors ${n.lu ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/40 dark:bg-blue-950/20'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 m-0">{n.titre}</p>
                            {!n.lu && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 m-0 line-clamp-2 leading-relaxed">{n.message}</p>
                          <small className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1.5">{new Date(n.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="top-user flex items-center gap-2">
              <div className="user-avatar">{userInitials}</div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{userName}</span>
              <ChevronDown size={15} className="text-slate-400 dark:text-slate-500" />
            </div>
          </div>
        </header>
        
        {/* We assume the children contains the .page-body since pages might have unique body padding or elements */}
        <div className="page-body">
          {children}
        </div>
      </main>
    </div>
  )
}
