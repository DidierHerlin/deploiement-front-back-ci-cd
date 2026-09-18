'use client'

import { LayoutDashboard, Users, Building2, FileText, Activity } from 'lucide-react'
import Navbar from '@/components/Navbar'

// Adapter uniquement les éléments de menu nécessaires au contexte du Dashboard.
const dashboardNavItems = [
  { label: 'Vue d’ensemble', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Biens', icon: Building2, href: '/dashboard/biens' },
  { label: 'Locataires', icon: Users, href: '/dashboard/locataires' },
  { label: 'Contrats', icon: FileText, href: '/dashboard/contrats' },
  { label: 'Reporting', icon: Activity, href: '/dashboard/reporting' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Navbar 
      navItems={dashboardNavItems}
      workspaceName="Espace Utilisateur"
      workspaceRole="Accès général"
      workspaceInitials="EU"
      userName="Utilisateur"
      userRole="Membre"
      userInitials="U"
    >
      {children}
    </Navbar>
  )
}
