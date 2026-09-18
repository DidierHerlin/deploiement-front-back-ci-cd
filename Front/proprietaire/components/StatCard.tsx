import { ArrowUpRight, Building2 } from 'lucide-react'

export function StatCard({ icon: Icon, label, value, detail, tone }: { icon: typeof Building2, label: string, value: string, detail: string, tone: string }) {
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
