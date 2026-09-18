'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { 
  getContrats, creerContrat, updateContrat, deleteContrat, actionContrat,
  getBiens, getLocataires, getPaiements,
  Contrat, Bien, Locataire, Paiement 
} from '@/lib/api'

import { ContratTable } from './components/ContratTable'
import { ContratSearch } from './components/ContratSearch'
import { ContratFilters } from './components/ContratFilters'
import { ContratForm } from './components/ContratForm'
import { ContratModal } from './components/ContratModal'
import { ActionContratModal } from './components/ActionContratModal'

export default function ContratPage() {
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [biens, setBiens] = useState<Bien[]>([])
  const [locataires, setLocataires] = useState<Locataire[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtres & Recherche
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('Tous')
  const [statutFilter, setStatutFilter] = useState('Tous')
  
  // Modals state
  const [showForm, setShowForm] = useState(false)
  const [editingContrat, setEditingContrat] = useState<Contrat | null>(null)
  
  const [viewContrat, setViewContrat] = useState<Contrat | null>(null)
  const [actionModal, setActionModal] = useState<{ contrat: Contrat, action: 'resilier'|'terminer'|'finaliser_vente'|'delete' } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [cData, bData, lData, pData] = await Promise.all([
        getContrats(),
        getBiens(),
        getLocataires(),
        getPaiements()
      ])
      setContrats(cData || [])
      setBiens(bData || [])
      setLocataires(lData || [])
      setPaiements(pData || [])
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Une erreur est survenue lors du chargement des données.")
    } finally {
      setLoading(false)
    }
  }

  async function handleFormSubmit(payload: any) {
    if (editingContrat) {
      await updateContrat(editingContrat.id, payload)
    } else {
      await creerContrat(payload)
    }
    await fetchData()
    setShowForm(false)
  }

  async function handleActionConfirm() {
    if (!actionModal) return
    try {
      if (actionModal.action === 'delete') {
        await deleteContrat(actionModal.contrat.id)
      } else {
        await actionContrat(actionModal.contrat.id, actionModal.action)
      }
      await fetchData()
      setActionModal(null)
      setViewContrat(null)
    } catch (error: any) {
      alert("Erreur lors de l'exécution de l'action : " + error.message)
    }
  }

  // Filtres
  const filteredContrats = useMemo(() => {
    return contrats.filter(c => {
      const searchStr = `${c.bien_titre} ${c.locataire_prenoms} ${c.locataire_nom} ${c.id}`.toLowerCase()
      const matchQuery = searchStr.includes(query.toLowerCase())
      
      const matchType = typeFilter === 'Tous' || c.type_contrat === typeFilter
      const matchStatut = statutFilter === 'Tous' || c.statut === statutFilter
      
      return matchQuery && matchType && matchStatut
    })
  }, [contrats, query, typeFilter, statutFilter])

  // Données pour les listes déroulantes (Seulement les biens DISPONIBLE à la création)
  const disponiblesBiens = biens.filter(b => b.statut === 'DISPONIBLE')

  const openCreateModal = () => {
    setEditingContrat(null)
    setShowForm(true)
  }

  return (
    <>
      <div className="welcome-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1>Gestion des <span>Contrats</span></h1>
          <p className="subtitle">Administrez les contrats de location et de vente, suivez leur statut et les échéances associées.</p>
        </div>
        <button className="primary-button" onClick={openCreateModal}>
          <Plus size={16} /> Nouveau contrat
        </button>
      </div>

      <section className="panel user-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="user-toolbar">
          <ContratSearch query={query} onQueryChange={setQuery} />
          <ContratFilters 
            typeFilter={typeFilter} setTypeFilter={setTypeFilter} 
            statutFilter={statutFilter} setStatutFilter={setStatutFilter} 
          />
        </div>
        
        <ContratTable 
          contrats={filteredContrats} 
          loading={loading} 
          error={error}
          onView={setViewContrat} 
          onEdit={c => { setEditingContrat(c); setShowForm(true) }}
          onDelete={c => setActionModal({ contrat: c, action: 'delete' })}
        />
      </section>

      {showForm && (
        <ContratForm 
          editingContrat={editingContrat} 
          disponiblesBiens={disponiblesBiens}
          locataires={locataires}
          onClose={() => setShowForm(false)} 
          onSubmit={handleFormSubmit} 
        />
      )}

      {viewContrat && (() => {
        const cPaiements = paiements.filter(p => p.contrat === viewContrat.id)
        return (
          <ContratModal 
            contrat={viewContrat} 
            paiements={cPaiements}
            onClose={() => setViewContrat(null)} 
            onAction={(action) => setActionModal({ contrat: viewContrat, action })}
          />
        )
      })()}

      {actionModal && (
        <ActionContratModal 
          contrat={actionModal.contrat} 
          actionType={actionModal.action}
          onCancel={() => setActionModal(null)}
          onConfirm={handleActionConfirm}
        />
      )}
    </>
  )
}
