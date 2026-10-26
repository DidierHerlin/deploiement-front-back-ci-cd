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
      case '/agent/profil':
        return t("dashboard.nav.profile", item.label)
      default:
        return item.label
    }
  }

  const currentNav = navItems.find(item => item.href === pathname || (item.href !== '#' && pathname.startsWith(item.href)))
  const activeLabel = currentNav ? getNavLabel(currentNav) : t("dashboard.nav.overview", "Vue d’ensemble")

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
          <button><Settings size={18} />{t("dashboard.nav.settings", "Paramètres")}</button>
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
            
            <LanguageSwitcher />

            <div className="notification-wrap" style={{ position: 'relative' }}>
              <button className="icon-button" aria-label="Notifications" onClick={handleToggleNotifications}>
                <Bell size={19} />
                {unreadCount > 0 && <i style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />}
              </button>
              
              {notificationsOpen && (
                <div className="notification-popover" style={{ position: 'absolute', top: '100%', right: 0, width: 320, background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 8 }}>
                  <div className="popover-head" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <strong style={{ fontSize: 14, color: 'var(--foreground)' }}>{t("dashboard.topbar.notifications", "Alertes")}</strong>
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCheck size={14} /> {notifications.length} {t("dashboard.topbar.total_alerts", "au total")}
                    </span>
                  </div>
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>{t("dashboard.topbar.no_alerts", "Aucune nouvelle")}</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: n.lu ? 'white' : '#f0f9ff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>{n.titre}</p>
                            {!n.lu && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{n.message}</p>
                          <small style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 6 }}>{new Date(n.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="top-user">
              <div className="user-avatar">{userInitials}</div>
              <ChevronDown size={15} />
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
