'use client'

import { useState, useEffect } from 'react'
import { WalletCards } from 'lucide-react'
import { getPaiements, Paiement } from '@/lib/api'
import { PaiementList } from "@/components/organisms/paiements_PaiementList"

export function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<string>('')

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

  // Le propriétaire ne doit voir que les paiements validés (PAYE) ou en retard (EN_RETARD)
  const paiementsFiltresBase = paiements.filter(
    p => p.statut === 'PAYE' || p.statut === 'EN_RETARD'
  )

  const uniqueStatuts = Array.from(new Set(paiementsFiltresBase.map(p => p.statut))).sort()

  const filteredPaiements = paiementsFiltresBase.filter(paiement => {
    if (filterStatut && paiement.statut !== filterStatut) return false
    return true
  })

  const formatStatut = (s: string) => {
    const map: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'PAYE': 'Payé',
      'EN_RETARD': 'En retard',
      'ECHOUE': 'Échoué',
      'REMBOURSE': 'Remboursé'
    }
    return map[s] || s
  }

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MES PAIEMENTS</p>
          <h1>Suivez <span>vos revenus.</span></h1>
          <p className="subtitle">Consultez l'historique et le statut des paiements liés à vos biens.</p>
        </div>
      </div>

      <section className="panel mt-6">
        <div className="panel-header flex-col md:flex-row gap-4" style={{ marginBottom: '20px' }}>
          <div>
            <h2>Historique des paiements</h2>
            <p>Retrouvez tous les versements, loyers et achats associés à vos contrats.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={filterStatut} 
              onChange={(e) => setFilterStatut(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-600 bg-white"
            >
              <option value="">Tous les statuts</option>
              {uniqueStatuts.map(s => <option key={s} value={s}>{formatStatut(s)}</option>)}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-[#8993a3]">Chargement de vos paiements...</div>
        ) : (
          <PaiementList paiements={filteredPaiements} onUpdate={() => fetchPaiements()} />
        )}
      </section>
    </>
  )
}
