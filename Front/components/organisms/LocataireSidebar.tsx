'use client'

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, WalletCards, ReceiptText, ChevronDown, X, ShieldCheck, LogOut, MoreHorizontal, Building2, CalendarCheck } from 'lucide-react';
import { deconnecter } from '@/lib/auth';
import { getUserPhotoSrc } from '@/lib/api';
import { getUserFullName, getUserInitials } from "@/components/organisms/userUtils";
import { useTranslation } from '@/lib/i18n';

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

export function LocataireSidebar({ mobileNav, setMobileNav, activeHref, user }: LocataireSidebarProps) {
  const { t } = useTranslation();
  const fullName = getUserFullName(user);
  const initials = getUserInitials(user);
  const photoSrc = getUserPhotoSrc(user);

  const getNavLabel = (href: string, defaultLabel: string) => {
    switch (href) {
      case '/locataire/dashboard':
        return t("dashboard.nav.my_dashboard", defaultLabel);
      case '/locataire/biens':
        return t("dashboard.nav.available_properties", defaultLabel);
      case '/locataire/reservations':
        return t("dashboard.nav.my_reservations", defaultLabel);
      case '/locataire/contrat':
        return t("dashboard.nav.my_contracts", defaultLabel);
      case '/locataire/paiements':
        return t("dashboard.nav.my_payments", defaultLabel);
      case '/locataire/quittances':
        return t("dashboard.nav.my_receipts", defaultLabel);
      default:
        return defaultLabel;
    }
  };

  return (
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand">
        <img src="/logo-app.avif" alt="Logo" style={{ height: '32px', width: 'auto' }} />
        <button className="close-nav" onClick={() => setMobileNav(false)}>
          <X size={18} />
        </button>
      </div>

      <div className="workspace">
        {photoSrc ? (
          <img src={photoSrc} alt={fullName} className="workspace-avatar user-initial" style={{ padding: 0, objectFit: 'cover' }} />
        ) : (
          <div className="workspace-avatar user-initial blue">{initials}</div>
        )}
        <div><strong>{fullName}</strong><small>{t("dashboard.roles.LOCATAIRE", "Locataire")}</small></div>
        <ChevronDown size={15} />
      </div>

      <nav className="main-nav" aria-label="Navigation locataire">
        {navItems.map(({ label, icon: Icon, href }) => (
          <Link key={href} href={href} className={activeHref === href ? 'active' : ''} onClick={() => setMobileNav(false)}>
            <Icon size={18} /><span>{getNavLabel(href, label)}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button onClick={deconnecter} style={{ color: '#ef4444' }}>
          <LogOut size={18} />{t("dashboard.nav.logout", "Se déconnecter")}
        </button>
        <div className="tenant-help dark:bg-slate-900/80 dark:border-slate-800 border border-transparent">
          <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
          <strong className="text-slate-900 dark:text-slate-200 font-semibold">
            {t("dashboard.locataire.security_notice", "Mes données sont protégées")}
          </strong>
          <p className="text-slate-500 dark:text-slate-400">
            {t("dashboard.locataire.security_sub", "Vous consultez uniquement vos informations personnelles et contractuelles.")}
          </p>
        </div>
        <div className="account">
          {photoSrc ? (
            <img src={photoSrc} alt={fullName} className="user-initial" style={{ padding: 0, objectFit: 'cover' }} />
          ) : (
            <div className="user-initial blue">{initials}</div>
          )}
          <div><strong>{fullName}</strong><small>{t("dashboard.roles.LOCATAIRE", "Locataire")}</small></div>
          <MoreHorizontal size={18} />
        </div>
      </div>
    </aside>
  );
}
