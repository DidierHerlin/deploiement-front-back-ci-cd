'use client'

import { useState, useEffect } from 'react'
import { getPaiements, Paiement } from '@/lib/api'
import { PaiementList } from '@/proprietaire/components/paiements/PaiementList'
import { PriorityPaiements } from './components/PriorityPaiements'

export default function AgentPaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<string>('EN_ATTENTE') // Par défaut, on montre les paiements à valider

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

  const filteredPaiements = paiements.filter(paiement => {
    if (filterStatut && paiement.statut !== filterStatut) return false
    return true
  })

  const formatStatut = (s: string) => {
    const map: Record<string, string> = {
      'EN_ATTENTE': 'À valider (En attente)',
      'PAYE': 'Payé',
      'EN_RETARD': 'En retard',
      'ECHOUE': 'Échoué / Refusé',
      'REMBOURSE': 'Remboursé'
    }
    return map[s] || s
  }

  return (
    <>
      <div className="welcome-row mb-6">
        <div>
          <p className="eyebrow">FINANCES & PAIEMENTS</p>
          <h1>Validation <span>des paiements.</span></h1>
          <p className="subtitle">Consultez, validez ou refusez les paiements des locataires et acquéreurs.</p>
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

      <section className="panel mt-6">
        <div className="panel-header flex-col md:flex-row gap-4" style={{ marginBottom: '20px' }}>
          <div>
            <h2>Historique & Tous les paiements</h2>
            <p>Vue d'ensemble des flux financiers de l'agence.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={filterStatut} 
              onChange={(e) => setFilterStatut(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-600 bg-white"
            >
              <option value="">Tous les statuts</option>
              {uniqueStatuts.map(s => <option key={s} value={s}>{formatStatut(s)}</option>)}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-[#8993a3]">Chargement des paiements...</div>
        ) : (
          <PaiementList paiements={filteredPaiements} />
        )}
      </section>
    </>
  )
}
