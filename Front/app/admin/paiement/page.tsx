'use client'

import { useState, useEffect, useMemo } from 'react'
import { getPaiements, Paiement } from '@/lib/api'
import { PaiementStats } from "@/components/molecules/paiement_PaiementStats"
import { PaiementSearch } from "@/components/organisms/PaiementSearch"
import { PaiementFilters } from "@/components/organisms/PaiementFilters"
import { PaiementTable } from "@/components/organisms/PaiementTable"
import { PaiementForm } from "@/components/organisms/PaiementForm"
import { PaiementDetails } from "@/components/organisms/PaiementDetails"
import { ValidationDemandeModal } from "@/components/organisms/ValidationDemandeModal"

export default function PaiementPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filters
  const [query, setQuery] = useState('')
  const [statutFilter, setStatutFilter] = useState('Tous')
  const [modeFilter, setModeFilter] = useState('Tous')
  const [onlyMobileMoneyPending, setOnlyMobileMoneyPending] = useState(false)
  
  // Modals state
  const [viewPaiement, setViewPaiement] = useState<Paiement | null>(null)
  const [editPaiement, setEditPaiement] = useState<Paiement | null>(null)
  const [validationPaiement, setValidationPaiement] = useState<Paiement | null>(null)
  const [validationAction, setValidationAction] = useState<'valider' | 'refuser'>('valider')

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

  const isMobileMoneyPending = (p: Paiement) =>
    p.statut === 'EN_ATTENTE' &&
    (['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY'].includes(p.demande_en_cours?.moyen_paiement || p.mode_paiement || '') || !!p.demande_en_cours)

  const mobileMoneyPendingCount = useMemo(() => {
    return paiements.filter(isMobileMoneyPending).length
  }, [paiements])

  // Derived state
  const filteredPaiements = useMemo(() => {
    return paiements.filter(p => {
      if (onlyMobileMoneyPending && !isMobileMoneyPending(p)) {
        return false
      }
      const effectiveMode = p.demande_en_cours?.moyen_paiement || p.mode_paiement
      const effectiveRef = p.demande_en_cours?.reference || p.reference || ''
      const searchStr = `${p.id} ${p.bien_titre} ${p.locataire_nom} ${effectiveRef}`.toLowerCase()
      const matchQuery = searchStr.includes(query.toLowerCase())
      const matchStatut = onlyMobileMoneyPending ? true : (statutFilter === 'Tous' || p.statut === statutFilter)
      const matchMode = onlyMobileMoneyPending ? true : (modeFilter === 'Tous' || (effectiveMode === modeFilter) || (!effectiveMode && modeFilter === 'Tous'))
      
      return matchQuery && matchStatut && matchMode
    })
  }, [paiements, query, statutFilter, modeFilter, onlyMobileMoneyPending])

  return (
    <>
      <div className="welcome-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1>Gestion des <span>Paiements</span></h1>
          <p className="subtitle">Supervisez l'ensemble des paiements, validez les demandes Mobile Money et générez les quittances.</p>
        </div>
      </div>

      <PaiementStats paiements={paiements} />

      <section className="panel user-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="user-toolbar">
          <PaiementSearch query={query} onQueryChange={setQuery} />
          <PaiementFilters 
            statutFilter={statutFilter} setStatutFilter={setStatutFilter}
            modeFilter={modeFilter} setModeFilter={setModeFilter}
            onlyMobileMoneyPending={onlyMobileMoneyPending}
            setOnlyMobileMoneyPending={setOnlyMobileMoneyPending}
            mobileMoneyPendingCount={mobileMoneyPendingCount}
          />
        </div>

        <PaiementTable 
          paiements={filteredPaiements}
          loading={loading}
          error={error}
          onView={setViewPaiement}
          onEdit={setEditPaiement}
          onValiderDemande={(p) => {
            setValidationPaiement(p)
            setValidationAction('valider')
          }}
          onRefuserDemande={(p) => {
            setValidationPaiement(p)
            setValidationAction('refuser')
          }}
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
          onValiderDemande={(p) => {
            setViewPaiement(null)
            setValidationPaiement(p)
            setValidationAction('valider')
          }}
          onRefuserDemande={(p) => {
            setViewPaiement(null)
            setValidationPaiement(p)
            setValidationAction('refuser')
          }}
        />
      )}

      {validationPaiement && (
        <ValidationDemandeModal
          paiement={validationPaiement}
          isOpen={!!validationPaiement}
          initialAction={validationAction}
          onClose={() => setValidationPaiement(null)}
          onSuccess={() => {
            setValidationPaiement(null)
            fetchData()
          }}
        />
      )}
    </>
  )
}
