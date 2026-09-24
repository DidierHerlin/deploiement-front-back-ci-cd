'use client'

import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, Building2, User, FileText, CircleDollarSign, CalendarCheck } from 'lucide-react'
import Navbar from "@/components/organisms/Navbar"
import { getProfil, UserProfil } from '@/lib/api'
import './agent.css'

const agentNavItems = [
  { label: 'Vue d\'ensemble', icon: LayoutDashboard, href: '/agent/dashboard' },
  { label: 'Biens immobiliers', icon: Building2, href: '/agent/biens' },
  { label: 'Locataires', icon: Users, href: '/agent/locataires' },
  { label: 'Réservations', icon: CalendarCheck, href: '/agent/reservations' },
  { label: 'Baux & contrats', icon: FileText, href: '/agent/contrats' },
  { label: 'Finances', icon: CircleDollarSign, href: '/agent/paiements' },
  { label: 'Mon Profil', icon: User, href: '/agent/profil' },
]

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfil | null>(null);

  useEffect(() => {
    getProfil().then(setUser).catch(console.error);
  }, []);

  const getFullName = () => {
    if (!user) return 'Chargement...';
    if (!user.prenoms && !user.nom) return user.email || 'Agent';
    return `${user.prenoms || ''} ${user.nom || ''}`.trim();
  };

  const getInitials = () => {
    if (!user) return '..';
    if (!user.prenoms && !user.nom) return user.email ? user.email.substring(0, 2).toUpperCase() : 'AG';
    return ((user.prenoms?.[0] || '') + (user.nom?.[0] || '')).toUpperCase() || 'AG';
  };

  const getRoleLabel = () => {
    if (!user) return '...';
    if (user.role === 'ADMIN') return 'Administrateur';
    if (user.role === 'AGENT') return 'Agent';
    if (user.role === 'LOCATAIRE') return 'Locataire';
    return user.role;
  };

  return (
    <Navbar 
      navItems={agentNavItems}
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
