'use client'
import { CalendarDays } from 'lucide-react'
import { AgentDashboardData } from '../../app/agent/dashboard/hooks/useAgentDashboard';

export default function ContractsList({ data }: { data: AgentDashboardData }) {
  const upcomingContracts = data.upcomingContracts;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <article className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Fins de contrats</h2>
          <p>À anticiper (60 prochains jours)</p>
        </div>
      </div>
      
      <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: '12px' }}>
        <table>
          <thead>
            <tr>
              <th>LOCATAIRE</th>
              <th>BIEN</th>
              <th style={{ textAlign: 'right' }}>ÉCHÉANCE</th>
            </tr>
          </thead>
          <tbody>
            {upcomingContracts.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>Aucun contrat n'expire prochainement.</td></tr>
            ) : (
              upcomingContracts.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="tenant">
                      <span>{item.locataire_nom ? item.locataire_nom.substring(0,2).toUpperCase() : 'IN'}</span>
                      <strong>{item.locataire_nom || 'Locataire inconnu'}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="property">
                      <div className="property-info">
                        <strong>{item.bien_titre}</strong>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="status pending" style={{ background: '#fff6e5', color: 'var(--orange)' }}>
                      <CalendarDays size={12} style={{ marginRight: '4px' }} /> {formatDate(item.date_fin!)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}
