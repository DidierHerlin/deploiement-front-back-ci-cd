import { ArrowUpRight } from 'lucide-react'

type DashboardCardProps = {
  icon: React.ElementType
  label: string
  value: string | number
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'red'
}

export function DashboardCard({ icon: Icon, label, value, detail, tone }: DashboardCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="stat-copy">
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
      <ArrowUpRight className="stat-arrow" size={17} />
    </article>
  )
}
