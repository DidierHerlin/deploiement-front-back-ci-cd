'use client'

import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, Building2, UserRound, FileText, Activity, CreditCard, CalendarCheck } from 'lucide-react'
import Navbar from "@/components/organisms/Navbar"

import { getProfil, UserProfil } from '@/lib/api'

const adminNavItems = [
  { label: 'Vue d\'ensemble', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Utilisateurs', icon: Users, badge: 'Nouveau', href: '/admin/utilisateur' },
  { label: 'Biens immobiliers', icon: Building2, href: '/admin/bien' },
  { label: 'Propriétaires', icon: UserRound, href: '/admin/proprietaire' },
  { label: 'Locataires', icon: Users, href: '/admin/locataire' },
  { label: 'Réservations', icon: CalendarCheck, href: '/admin/reservation' },
  { label: 'Contrats', icon: FileText, href: '/admin/contrat' },
  { label: 'Paiements', icon: CreditCard, href: '/admin/paiement' },
  { label: 'Reporting', icon: Activity, href: '/admin/reporting' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfil | null>(null);

  useEffect(() => {
    getProfil().then(setUser).catch(console.error);
  }, []);

  const getFullName = () => {
    if (!user) return 'Chargement...';
    if (!user.prenoms && !user.nom) return user.email || 'Admin';
    return `${user.prenoms || ''} ${user.nom || ''}`.trim();
  };

  const getInitials = () => {
    if (!user) return '..';
    if (!user.prenoms && !user.nom) return user.email ? user.email.substring(0, 2).toUpperCase() : 'AD';
    return ((user.prenoms?.[0] || '') + (user.nom?.[0] || '')).toUpperCase() || 'AD';
  };

  const getRoleLabel = () => {
    if (!user) return '...';
    if (user.role === 'ADMIN') return 'Administrateur';
    if (user.role === 'AGENT') return 'Agent';
    return user.role;
  };

  return (
    <Navbar 
      navItems={adminNavItems}
      workspaceName={getFullName()}
      workspaceRole={getRoleLabel()}
      workspaceInitials={getInitials()}
      userName={getFullName()}
      userRole={getRoleLabel()}
      userInitials={getInitials()}
    >
      {children}
    </Navbar>
  )
}
