import React from 'react';
import { FileText, Wallet, Clock } from 'lucide-react';
import { AdminDashboardData } from '../../app/admin/dashboard/hooks/useAdminDashboard';

export function RecentActivities({ data }: { data: AdminDashboardData }) {
  const { recentEvents } = data;
  
  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000); // secondes
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff/3600)} h`;
    return `Il y a ${Math.floor(diff/86400)} j`;
  };

  const getIcon = (iconName: string) => {
    if (iconName === 'FileText') return FileText;
    if (iconName === 'Wallet') return Wallet;
    return Clock;
  }

  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Activité Récente</h2>
          <p>Derniers événements sur la plateforme</p>
        </div>
      </div>
      
      {(!recentEvents || recentEvents.length === 0) ? (
        <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Clock size={32} style={{ opacity: 0.2, margin: '0 auto 10px' }} />
          <p>Aucune activité récente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {recentEvents.map(ev => {
            const Icon = getIcon(ev.icon);
            return (
              <div key={ev.id} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `var(--${ev.color}-light, #f1f5f9)`, color: `var(--${ev.color}, #64748b)`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: '12px', color: 'var(--navy)', display: 'block' }}>{ev.title}</strong>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 4px' }}>{ev.text}</p>
                  <span style={{ fontSize: '10px', color: '#a0a8b5' }}>{getTimeAgo(ev.date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
