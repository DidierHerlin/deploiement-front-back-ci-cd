'use client'

import { useState, useEffect, useMemo } from 'react'
import { getPaiements, Paiement } from '@/lib/api'
import { PaiementStats } from "@/components/molecules/paiement_PaiementStats"
import { PaiementSearch } from "@/components/organisms/PaiementSearch"
import { PaiementFilters } from "@/components/organisms/PaiementFilters"
import { PaiementTable } from "@/components/organisms/PaiementTable"
import { PaiementForm } from "@/components/organisms/PaiementForm"
import { PaiementDetails } from "@/components/organisms/PaiementDetails"

export default function PaiementPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filters
  const [query, setQuery] = useState('')
  const [statutFilter, setStatutFilter] = useState('Tous')
  const [modeFilter, setModeFilter] = useState('Tous')
  
  // Modals state
  const [viewPaiement, setViewPaiement] = useState<Paiement | null>(null)
  const [editPaiement, setEditPaiement] = useState<Paiement | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPaiements()
      setPaiements(data || [])
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Une erreur est survenue lors du chargement des données.")
    } finally {
      setLoading(false)
    }
  }

  // Derived state
  const filteredPaiements = useMemo(() => {
    return paiements.filter(p => {
      const searchStr = `${p.id} ${p.bien_titre} ${p.locataire_nom} ${p.reference || ''}`.toLowerCase()
      const matchQuery = searchStr.includes(query.toLowerCase())
      const matchStatut = statutFilter === 'Tous' || p.statut === statutFilter
      const matchMode = modeFilter === 'Tous' || (p.mode_paiement === modeFilter) || (!p.mode_paiement && modeFilter === 'Tous')
      
      return matchQuery && matchStatut && matchMode
    })
  }, [paiements, query, statutFilter, modeFilter])

  return (
    <>
      <div className="welcome-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1>Gestion des <span>Paiements</span></h1>
          <p className="subtitle">Supervisez l'ensemble des paiements, identifiez les impayés et générez les quittances.</p>
        </div>
      </div>

      <PaiementStats paiements={paiements} />

      <section className="panel user-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="user-toolbar">
          <PaiementSearch query={query} onQueryChange={setQuery} />
          <PaiementFilters 
            statutFilter={statutFilter} setStatutFilter={setStatutFilter}
            modeFilter={modeFilter} setModeFilter={setModeFilter}
          />
        </div>

        <PaiementTable 
          paiements={filteredPaiements}
          loading={loading}
          error={error}
          onView={setViewPaiement}
          onEdit={setEditPaiement}
        />
      </section>

      {editPaiement && (
        <PaiementForm 
          paiement={editPaiement}
          onClose={() => setEditPaiement(null)}
          onSuccess={() => {
            setEditPaiement(null)
            fetchData()
          }}
        />
      )}

      {viewPaiement && (
        <PaiementDetails 
          paiement={viewPaiement}
          onClose={() => setViewPaiement(null)}
        />
      )}
    </>
  )
}
