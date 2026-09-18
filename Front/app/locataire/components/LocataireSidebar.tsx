'use client'

import React from 'react';
import Link from 'next/link';
import { Home, LayoutDashboard, FileText, WalletCards, ReceiptText, ChevronDown, X, ShieldCheck, Mail, LogOut, MoreHorizontal, Building2, CalendarCheck } from 'lucide-react';
import { deconnecter } from '@/lib/auth';

const navItems = [
  { label: 'Mon tableau de bord', icon: LayoutDashboard, href: '/locataire/dashboard' },
  { label: 'Biens disponibles', icon: Building2, href: '/locataire/biens' },
  { label: 'Mes réservations', icon: CalendarCheck, href: '/locataire/reservations' },
  { label: 'Mes contrats', icon: FileText, href: '/locataire/contrat' },
  { label: 'Mes paiements', icon: WalletCards, href: '/locataire/paiements' },
  { label: 'Mes quittances', icon: ReceiptText, href: '/locataire/quittances' },
];

interface LocataireSidebarProps {
  mobileNav: boolean;
  setMobileNav: (open: boolean) => void;
  activeHref?: string;
  user: any;
}

import { getUserFullName, getUserInitials } from './userUtils';

export function LocataireSidebar({ mobileNav, setMobileNav, activeHref, user }: LocataireSidebarProps) {
  const fullName = getUserFullName(user);
  const initials = getUserInitials(user);

  return (
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand">
        <img src="/logo-app.avif" alt="Logo" style={{ height: '32px', width: 'auto' }} />
        <button className="close-nav" onClick={() => setMobileNav(false)}>
          <X size={18} />
        </button>
      </div>

      <div className="workspace">
        {user?.photo_profil ? (
          <img src={user.photo_profil} alt={fullName} className="workspace-avatar user-initial" style={{ padding: 0, objectFit: 'cover' }} />
        ) : (
          <div className="workspace-avatar user-initial blue">{initials}</div>
        )}
        <div><strong>{fullName}</strong><small>Locataire</small></div>
        <ChevronDown size={15} />
      </div>

      <nav className="main-nav" aria-label="Navigation locataire">
        {navItems.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} className={activeHref === href ? 'active' : ''}>
            <Icon size={18} /><span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button onClick={deconnecter} style={{ color: '#ef4444' }}>
          <LogOut size={18} />Se déconnecter
        </button>
        <div className="tenant-help">
          <ShieldCheck size={18} />
          <strong>Mes données sont protégées</strong>
          <p>Vous consultez uniquement vos informations personnelles et contractuelles.</p>
        </div>
        <div className="account">
          {user?.photo_profil ? (
            <img src={user.photo_profil} alt={fullName} className="user-initial" style={{ padding: 0, objectFit: 'cover' }} />
          ) : (
            <div className="user-initial blue">{initials}</div>
          )}
          <div><strong>{fullName}</strong><small>Locataire</small></div>
          <MoreHorizontal size={18} />
        </div>
      </div>
    </aside>
  );
}
