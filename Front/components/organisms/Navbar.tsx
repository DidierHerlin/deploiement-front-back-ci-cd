'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, ChevronDown, ChevronRight, Home, Menu, MoreHorizontal, Search, Settings, ShieldCheck, X, LogOut
} from 'lucide-react'
import { deconnecter } from '@/lib/auth'
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
  const [mobileNav, setMobileNav] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const pathname = usePathname()

  const currentNav = navItems.find(item => item.href === pathname || (item.href !== '#' && pathname.startsWith(item.href)))
  const activeLabel = currentNav ? currentNav.label : 'Vue d’ensemble'

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
          {navItems.map(({ label, icon: Icon, badge, href }) => {
            const isActive = pathname === href || (href !== '#' && pathname.startsWith(href) && href !== '/dashboard')
            return (
              <Link key={label} href={href} className={isActive ? 'active' : ''} onClick={() => setMobileNav(false)}>
                <Icon size={18} /><span>{label}</span>{badge && <b>{badge}</b>}
              </Link>
            )
          })}
        </nav>
        
        <div className="sidebar-bottom">
          <button><Settings size={18} />Paramètres</button>
          <button onClick={deconnecter} style={{ color: '#ef4444' }}><LogOut size={18} />Déconnexion</button>
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
              <input aria-label="Rechercher" placeholder="Rechercher..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="notification-wrap">
              <button className="icon-button" aria-label="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <Bell size={19} /><i />
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <div className="popover-head">
                    <strong>Alertes</strong><span>Aucune nouvelle</span>
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
