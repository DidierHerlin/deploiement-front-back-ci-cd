"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, FileText, WalletCards, Settings, CircleDollarSign, MoreHorizontal, X, ChevronDown, Menu, ChevronRight } from 'lucide-react'
import { deconnecter } from '@/lib/auth'
import { getProfil, UserProfil } from '@/lib/api'
import '@/proprietaire/styles/dashboard.css'

const navItems = [
  { label: 'Vue d’ensemble', icon: Home, path: '/proprietaire/dashboard' },
  { label: 'Mes biens', icon: Building2, path: '/proprietaire/biens' },
  { label: 'Mes contrats', icon: FileText, path: '/proprietaire/contrats' },
  { label: 'Mes paiements', icon: WalletCards, path: '/proprietaire/paiements' },
]

export function ProprietaireLayout({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false)
  const pathname = usePathname()
  const [profil, setProfil] = useState<UserProfil | null>(null)

  useEffect(() => {
    getProfil()
      .then(setProfil)
      .catch(err => console.error("Erreur chargement profil", err))
  }, [])

  const fullName = profil ? `${profil.prenoms} ${profil.nom}`.trim() : 'Propriétaire'
  const initials = profil ? `${profil.prenoms?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase() || 'P' : 'DH'

  return (
    <div className="prop-app-shell">
      <aside className={`prop-sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand">
          <img src="/logo-app.avif" alt="Logo" style={{ height: '32px', width: 'auto' }} />
          <button className="close-nav" onClick={() => setMobileNav(false)}><X size={18} /></button>
        </div>
        <div className="workspace">
          <div className="workspace-avatar owner-avatar">{initials}</div>
          <div><strong>{fullName}</strong><small>Propriétaire</small></div>
          <ChevronDown size={15} />
        </div>
        <nav className="main-nav" aria-label="Navigation propriétaire">
          {navItems.map(({ label, icon: Icon, path }) => {
            const isActive = pathname === path
            return (
              <Link key={label} href={path} className={isActive ? 'active flex items-center gap-3 text-sm' : 'flex items-center gap-3 text-[#687386] hover:text-[#17202b] hover:bg-[#f4f6fa] p-2 rounded-lg transition-colors text-sm'} onClick={() => setMobileNav(false)}>
                <Icon size={18} /><span>{label}</span>
                {label === 'Mes paiements' && <b className="ml-auto bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">3</b>}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/proprietaire/profil" className="w-full mb-4 flex items-center gap-3 text-[#687386] hover:text-[#17202b] hover:bg-[#f4f6fa] p-2 rounded-lg transition-colors text-sm">
            <Settings size={18} /> Profil
          </Link>
          <button onClick={deconnecter} className="w-full mb-4 flex items-center gap-3 !text-red-600 hover:!text-red-700 hover:!bg-red-50 p-2 rounded-lg transition-colors text-sm text-left font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Se déconnecter
          </button>
          <div className="owner-help"><CircleDollarSign size={18} /><strong>Votre espace propriétaire</strong><p>Retrouvez toutes les informations de votre patrimoine.</p></div>
          <div className="account"><div className="user-avatar">{initials}</div><div><strong>{fullName}</strong><small>Propriétaire</small></div><MoreHorizontal size={18} /></div>
        </div>
      </aside>

      <main className="prop-main-content">
        <header className="prop-topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)}><Menu size={21} /></button>
          <div className="breadcrumbs">
            <span>Mon espace</span><ChevronRight size={15} />
            <strong>{pathname.includes('profil') ? 'Profil' : 'Vue d’ensemble'}</strong>
          </div>
          <div className="top-actions">
            <div className="top-user"><div className="user-avatar">{initials}</div><ChevronDown size={15} /></div>
          </div>
        </header>
        <div className="prop-page-body">
          {children}
        </div>
      </main>
    </div>
  )
}
