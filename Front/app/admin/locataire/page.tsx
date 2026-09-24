'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { 
  getLocataires, createLocataire, updateLocataire, 
  getContrats, getPaiements, updateUser,
  Locataire, Contrat, Paiement 
} from '@/lib/api'

import { LocataireTable } from "@/components/organisms/LocataireTable"
import { LocataireSearch } from "@/components/organisms/LocataireSearch"
import { LocataireFilters } from "@/components/organisms/LocataireFilters"
import { LocataireForm } from "@/components/organisms/LocataireForm"
import { LocataireModal } from "@/components/organisms/LocataireModal"
import { DisableLocataireModal } from "@/components/organisms/DisableLocataireModal"

export default function LocatairePage() {
  const [locataires, setLocataires] = useState<Locataire[]>([])
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtres & Recherche
  const [query, setQuery] = useState('')
  const [statutFilter, setStatutFilter] = useState('Tous')
  
  // Modals state
  const [showForm, setShowForm] = useState(false)
  const [editingLoc, setEditingLoc] = useState<Locataire | null>(null)
  const [viewLoc, setViewLoc] = useState<Locataire | null>(null)
  const [disableLoc, setDisableLoc] = useState<Locataire | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [locsData, contratsData, paiementsData] = await Promise.all([
        getLocataires(),
        getContrats(),
        getPaiements()
      ])
      setLocataires(locsData || [])
      setContrats(contratsData || [])
      setPaiements(paiementsData || [])
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Une erreur est survenue lors du chargement des données.")
    } finally {
      setLoading(false)
    }
  }

  // RG-04 Disable logic: Patch the User model to is_active=false instead of deleting Locataire
  async function handleDisableConfirm() {
    if (!disableLoc) return
    try {
      await updateUser(disableLoc.user.id, { is_active: false })
      await fetchData()
      setDisableLoc(null)
    } catch (error: any) {
      alert("Erreur lors de la désactivation: " + error.message)
    }
  }

  async function handleFormSubmit(payload: any) {
    if (editingLoc) {
      await updateLocataire(editingLoc.id, payload)
    } else {
      await createLocataire(payload)
    }
    await fetchData()
    setShowForm(false)
  }

  // Filtres
  const filteredLocs = useMemo(() => {
    return locataires.filter(l => {
      const u = l.user
      const searchStr = `${u.nom} ${u.prenoms} ${u.email} ${u.telephone || ''}`.toLowerCase()
      const matchQuery = searchStr.includes(query.toLowerCase())
      
      const isActive = u.is_active ?? true
      let matchStatut = true
      if (statutFilter === 'Actif') matchStatut = isActive
      if (statutFilter === 'Désactivé') matchStatut = !isActive
      
      return matchQuery && matchStatut
    })
  }, [locataires, query, statutFilter])

  // Count contrats and biens per locataire
  const { contratsCountMap, biensCountMap } = useMemo(() => {
    const cMap: Record<number, number> = {}
    const bMap: Record<number, number> = {}
    
    contrats.forEach(c => {
      if (c.locataire) {
        cMap[c.locataire] = (cMap[c.locataire] || 0) + 1
        // We assume 1 contrat = 1 bien. If multiple contrats for same bien, this counts instances.
        if (c.bien) {
          bMap[c.locataire] = (bMap[c.locataire] || 0) + 1
        }
      }
    })
    return { contratsCountMap: cMap, biensCountMap: bMap }
  }, [contrats])

  const openEditModal = (l: Locataire) => {
    setEditingLoc(l)
    setShowForm(true)
  }

  const openCreateModal = () => {
    setEditingLoc(null)
    setShowForm(true)
  }

  return (
    <>
      <div className="welcome-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1>Gestion des <span>Locataires</span></h1>
          <p className="subtitle">Gérez les locataires, leurs contrats, leurs accès et consultez l'historique de leurs locations.</p>
        </div>
        <button className="primary-button" onClick={openCreateModal}>
          <Plus size={16} /> Ajouter un locataire
        </button>
      </div>

      <section className="panel user-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="user-toolbar">
          <LocataireSearch query={query} onQueryChange={setQuery} />
          <LocataireFilters statutFilter={statutFilter} setStatutFilter={setStatutFilter} />
        </div>
        
        <LocataireTable 
          locataires={filteredLocs} 
          loading={loading} 
          error={error}
          contratsCountMap={contratsCountMap}
          biensCountMap={biensCountMap}
          onView={setViewLoc} 
          onEdit={openEditModal} 
          onDisable={setDisableLoc} 
        />
      </section>

      {showForm && (
        <LocataireForm 
          editingLoc={editingLoc} 
          onClose={() => setShowForm(false)} 
          onSubmit={handleFormSubmit} 
        />
      )}

      {viewLoc && (() => {
        const locContrats = contrats.filter(c => c.locataire === viewLoc.id)
        const locPaiements = paiements.filter(p => locContrats.some(c => c.id === p.contrat))
        return (
          <LocataireModal 
            locataire={viewLoc} 
            contrats={locContrats}
            paiements={locPaiements}
            onClose={() => setViewLoc(null)} 
          />
        )
      })()}

      {disableLoc && (
        <DisableLocataireModal 
          locataire={disableLoc} 
          onCancel={() => setDisableLoc(null)} 
          onConfirm={handleDisableConfirm} 
        />
      )}
    </>
  )
}
