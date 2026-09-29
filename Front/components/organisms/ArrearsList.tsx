'use client'
import { useState } from 'react'
import { Check, Mail } from 'lucide-react'
import { AgentDashboardData } from '../../app/agent/dashboard/hooks/useAgentDashboard';

export default function ArrearsList({ data, onToast }: { data: AgentDashboardData, onToast: (msg: string) => void }) {
  const { impayes } = data;
  const [sent, setSent] = useState<string[]>([]);

  const arrears = impayes.list;

  const sendReminder = (name: string) => {
    setSent((c) => [...c, name])
    onToast(`Relance envoyée à ${name}`)
  }

  return (
    <article className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Retards de paiement</h2>
          <p>Paiements non reçus (À traiter)</p>
        </div>
      </div>
      
      <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: '12px' }}>
        <table>
          <thead>
            <tr>
              <th>LOCATAIRE</th>
              <th>BIEN</th>
              <th>MONTANT</th>
              <th>RETARD</th>
              <th style={{ textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {arrears.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Aucun retard de paiement.</td></tr>
            ) : (
              arrears.map((item) => {
                const amount = item.montant;
                const diffTime = Math.abs(new Date().getTime() - new Date(item.date_echeance).getTime());
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="tenant">
                        <span>{item.locataire_nom ? item.locataire_nom.substring(0,2).toUpperCase() : 'IN'}</span>
                        <strong>{item.locataire_nom || 'Inconnu'}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="property">
                        <div className="property-info">
                          <strong>{item.bien_titre}</strong>
                        </div>
                      </div>
                    </td>
                    <td><strong style={{ color: 'var(--red)' }}>{amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar</strong></td>
                    <td><span className="status pending" style={{ background: '#fff0f1', color: 'var(--red)' }}><i style={{ background: 'var(--red)' }} />{days} jours</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => sendReminder(item.locataire_nom)}
                        className={sent.includes(item.locataire_nom) ? "outline-button" : "primary-button"}
                        style={{ padding: '6px 10px', fontSize: '10px', display: 'inline-flex', marginLeft: 'auto' }}
                      >
                        {sent.includes(item.locataire_nom) ? <><Check size={12} /> Envoyé</> : <><Mail size={12} /> Relancer</>}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}
