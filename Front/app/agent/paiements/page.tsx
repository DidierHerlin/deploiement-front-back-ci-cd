'use client'

import { useState, useEffect } from 'react'
import { getPaiements, Paiement } from '@/lib/api'
import { PaiementList } from "@/components/organisms/paiements_PaiementList"
import { PriorityPaiements } from "@/components/organisms/PriorityPaiements"

export default function AgentPaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<string>('EN_ATTENTE')

  const fetchPaiements = async () => {
    try {
      setLoading(true)
      const data = await getPaiements()
      setPaiements(data)
    } catch (err) {
      console.error("Erreur chargement paiements", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaiements()
  }, [])

  const uniqueStatuts = Array.from(new Set(paiements.map(p => p.statut))).sort()
  const pendingCount = paiements.filter(p => p.statut === 'EN_ATTENTE').length

  const filteredPaiements = paiements.filter(paiement => {
    if (filterStatut && paiement.statut !== filterStatut) return false
    return true
  })

  const formatStatut = (s: string) => {
    const map: Record<string, string> = {
      'EN_ATTENTE': 'À valider (En attente)',
      'PAYE': 'Payé',
      'VALIDE': 'Validé',
      'EN_RETARD': 'En retard',
      'ECHOUE': 'Échoué / Refusé',
      'REMBOURSE': 'Remboursé'
    }
    return map[s] || s
  }

  return (
    <>
      <div className="agent-head">
        <div>
          <p className="eyebrow">FINANCES & PAIEMENTS</p>
          <h1>Validation <span>des paiements.</span></h1>
          <p className="subtitle">Consultez, validez ou refusez les paiements des locataires et acquéreurs.</p>
        </div>
        <div className="agent-head-actions">
          <span className={`agent-badge ${pendingCount > 0 ? 'attente' : 'valide'}`}>
            {pendingCount > 0 ? `${pendingCount} à valider` : 'File traitée'}
          </span>
        </div>
      </div>

      {!loading && paiements.length > 0 && (
        <PriorityPaiements
          paiements={paiements}
          onUpdate={() => {
            fetchPaiements()
          }}
        />
      )}

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="agent-panel-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0 }}>Historique & tous les paiements</h2>
            <p style={{ margin: '5px 0 0', color: '#9aa3b0', fontSize: 11 }}>Vue d&apos;ensemble des flux financiers de l&apos;agence.</p>
          </div>
          <select
            className="agent-select"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {uniqueStatuts.map(s => <option key={s} value={s}>{formatStatut(s)}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="agent-loading">Chargement des paiements...</div>
        ) : (
          <PaiementList paiements={filteredPaiements} onUpdate={() => fetchPaiements()} />
        )}
      </section>
    </>
  )
}
