import { Users, Building2, FileText, CircleDollarSign } from 'lucide-react'
import { DashboardCard } from "@/components/molecules/DashboardCard"

type StatisticsProps = {
  usersCount: number
}

export function Statistics({ usersCount }: StatisticsProps) {
  return (
    <section className="stats-grid">
      <DashboardCard icon={Users} label="Utilisateurs" value={usersCount} detail="Comptes enregistrés" tone="blue" />
      <DashboardCard icon={Building2} label="Biens gérés" value="--" detail="+6 ce mois-ci" tone="green" />
      <DashboardCard icon={FileText} label="Contrats actifs" value="--" detail="83,7% du portefeuille" tone="orange" />
      <DashboardCard icon={CircleDollarSign} label="Revenus suivis" value="--" detail="+5,8% ce mois-ci" tone="red" />
    </section>
  )
}
