'use client'

import { useState, useEffect } from 'react'
import { getPaiements, Paiement } from '@/lib/api'
import { PaiementList } from "@/components/organisms/paiements_PaiementList"
import { PriorityPaiements } from "@/components/organisms/PriorityPaiements"
import { Smartphone } from 'lucide-react'

export default function AgentPaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<string>('EN_ATTENTE')
  const [filterMobileMoneyOnly, setFilterMobileMoneyOnly] = useState(false)

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
  const isMobileMoneyPending = (p: Paiement) =>
    p.statut === 'EN_ATTENTE' && 
    (['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY'].includes(p.demande_en_cours?.moyen_paiement || p.mode_paiement || '') || !!p.demande_en_cours)

  const mobileMoneyPendingCount = paiements.filter(isMobileMoneyPending).length

  const filteredPaiements = paiements.filter(paiement => {
    if (filterMobileMoneyOnly) {
      return isMobileMoneyPending(paiement)
    }
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
        <div className="agent-head-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {mobileMoneyPendingCount > 0 && (
            <span
              className="agent-badge attente"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0'
              }}
            >
              <Smartphone size={12} /> {mobileMoneyPendingCount} Mobile Money à valider
            </span>
          )}
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
        <div className="agent-panel-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Historique & tous les paiements</h2>
            <p style={{ margin: '5px 0 0', color: '#9aa3b0', fontSize: 11 }}>Vue d&apos;ensemble des flux financiers de l&apos;agence.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFilterMobileMoneyOnly(!filterMobileMoneyOnly)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: filterMobileMoneyOnly ? '#059669' : '#ecfdf5',
                color: filterMobileMoneyOnly ? '#ffffff' : '#047857',
                border: `1px solid ${filterMobileMoneyOnly ? '#059669' : '#a7f3d0'}`,
                transition: 'all 0.15s ease',
              }}
              title="Filtrer pour afficher uniquement les demandes Mobile Money soumises par les locataires"
            >
              <Smartphone size={13} />
              <span>Demandes Mobile Money</span>
              <span
                style={{
                  backgroundColor: filterMobileMoneyOnly ? 'rgba(255,255,255,0.25)' : '#10b981',
                  color: '#ffffff',
                  borderRadius: '999px',
                  padding: '1px 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {mobileMoneyPendingCount}
              </span>
            </button>

            <select
              className="agent-select"
              value={filterMobileMoneyOnly ? '' : filterStatut}
              onChange={(e) => {
                setFilterMobileMoneyOnly(false);
                setFilterStatut(e.target.value);
              }}
              aria-label="Filtrer par statut"
            >
              <option value="">Tous les statuts</option>
              {uniqueStatuts.map(s => <option key={s} value={s}>{formatStatut(s)}</option>)}
            </select>
          </div>
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
