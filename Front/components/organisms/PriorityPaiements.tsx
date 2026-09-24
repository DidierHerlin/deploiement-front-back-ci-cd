'use client'

import { useState } from 'react'
import { Paiement } from '@/lib/api'
import { AlertCircle, Clock, CheckCircle2, User, Eye } from "lucide-react"
import { AgentActions } from "@/components/organisms/AgentActions"
import { FactureModal } from "@/components/organisms/FactureModal"
import { Pagination } from "@/components/molecules/pagination"

interface PriorityPaiementsProps {
  paiements: Paiement[]
  onUpdate: (p: Paiement) => void
}

export function PriorityPaiements({ paiements, onUpdate }: PriorityPaiementsProps) {
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null)

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const now = new Date()
  now.setHours(0,0,0,0)

  const prioritaires = paiements.filter(p => {
    if (p.statut !== 'EN_ATTENTE') return false
    if (!p.date_echeance) return false
    const due = new Date(p.date_echeance)
    due.setHours(0,0,0,0)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }).sort((a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime())

  if (prioritaires.length === 0) {
    return (
      <div className="agent-empty" style={{ marginBottom: 18 }}>
        <CheckCircle2 size={30} />
        <h3 style={{ margin: '8px 0 4px', color: 'var(--navy)', fontSize: 14 }}>Aucun paiement prioritaire</h3>
        <p>Tous les paiements urgents ont été traités.</p>
      </div>
    )
  }

  const totalPages = Math.ceil(prioritaires.length / ITEMS_PER_PAGE);
  const paginatedData = prioritaires.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getDaysInfo = (dateStr: string) => {
    const due = new Date(dateStr)
    due.setHours(0,0,0,0)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return <span className="agent-badge annulee">Dépassé de {Math.abs(diffDays)} j</span>
    } else if (diffDays === 0) {
      return <span className="agent-badge attente">Aujourd&apos;hui</span>
    } else {
      return <span className="agent-badge attente">Dans {diffDays} j</span>
    }
  }

  return (
    <>
      <div className="panel agent-priority" style={{ padding: 0, marginBottom: 18 }}>
        <div className="agent-priority-head">
          <AlertCircle size={20} />
          <div>
            <h2>Paiements prioritaires à traiter</h2>
            <p>Échéances dépassées ou à moins de 7 jours — à valider en priorité.</p>
          </div>
        </div>

        <div className="agent-table-wrap">
          <table className="agent-table">
            <thead>
              <tr>
                <th>Bien & locataire</th>
                <th>Échéance & délai</th>
                <th className="num">Loyer total</th>
                <th className="num">Commission (10%)</th>
                <th className="center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(p => {
                const baseAmount = parseFloat(p.montant_paye as string) || parseFloat(p.montant as string) || parseFloat(p.montant_attendu as string) || 0

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{p.bien_titre || 'Bien inconnu'}</div>
                      <div className="agent-row-sub">
                        <User size={12} /> {p.locataire_nom || 'Non spécifié'}
                      </div>
                      <div style={{ fontSize: 11, color: '#a0a8b5', marginTop: 2 }}>{p.message_mois}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{new Date(p.date_echeance).toLocaleDateString('fr-FR')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                        <Clock size={12} style={{ color: 'var(--muted-foreground)' }} /> {getDaysInfo(p.date_echeance)}
                      </div>
                    </td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--navy)' }}>
                      {baseAmount.toLocaleString('fr-FR')} Ar
                    </td>
                    <td className="num" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      {Number(p.commission_agent || 0).toLocaleString('fr-FR')} Ar
                    </td>
                    <td>
                      <div style={{ minWidth: 200 }}>
                        <button onClick={() => setSelectedPaiement(p)} className="outline-button" style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}><Eye size={14} /> Visualiser</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {selectedPaiement && (
          <FactureModal
            paiement={selectedPaiement}
            isAgent={true}
            onClose={() => setSelectedPaiement(null)} onStatusChange={(updated) => onUpdate(updated)}
          />
        )}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
