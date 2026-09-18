import { MoreHorizontal } from 'lucide-react'

type ActivityItem = {
  icon: React.ElementType
  tone: string
  title: string
  text: string
  time: string
}

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Activité récente</h2>
          <p>Les dernières actions enregistrées sur la plateforme</p>
        </div>
        <button className="more-button" aria-label="Plus d’options">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="activity-list">
        {activities.map((item) => {
          const Icon = item.icon
          return (
            <div className="activity" key={item.title}>
              <div className={`notification-icon ${item.tone}`}>
                <Icon size={16} />
              </div>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <small>{item.time}</small>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
