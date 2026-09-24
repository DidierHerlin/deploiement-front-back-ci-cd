import { ArrowUpRight } from 'lucide-react'

type GlobalViewProps = {
  totalUsers: number
  counts: {
    proprietaires: number
    locataires: number
    agents: number
    admins: number
  }
}

export function GlobalView({ totalUsers, counts }: GlobalViewProps) {
  // Calculs de pourcentages approximatifs (juste pour la démo visuelle de la barre)
  const p1 = totalUsers ? (counts.proprietaires / totalUsers) * 100 : 0
  const p2 = totalUsers ? (counts.locataires / totalUsers) * 100 : 0
  const p3 = totalUsers ? (counts.agents / totalUsers) * 100 : 0
  const p4 = totalUsers ? (counts.admins / totalUsers) * 100 : 0

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Vue globale</h2>
          <p>Répartition des comptes utilisateurs</p>
        </div>
        <button className="outline-button">Reporting <ArrowUpRight size={15} /></button>
      </div>
      <div className="distribution">
        <div>
          <span className="distribution-number">{totalUsers}</span>
          <span>comptes</span>
        </div>
        <div className="distribution-bar">
          <i style={{ width: `${p1}%` }} />
          <i style={{ width: `${p2}%` }} />
          <i style={{ width: `${p3}%` }} />
          <i style={{ width: `${p4}%` }} />
        </div>
        <div className="legend">
          <span><i className="blue-dot" />Propriétaires <strong>{counts.proprietaires}</strong></span>
          <span><i className="green-dot" />Locataires <strong>{counts.locataires}</strong></span>
          <span><i className="purple-dot" />Agents <strong>{counts.agents}</strong></span>
          <span><i className="orange-dot" />Admins <strong>{counts.admins}</strong></span>
        </div>
      </div>
    </section>
  )
}
