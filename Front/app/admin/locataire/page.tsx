'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { 
  getLocataires, createLocataire, updateLocataire, 
  getContrats, getPaiements, updateUser,
  Locataire, Contrat, Paiement 
} from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

import { LocataireTable } from "@/components/organisms/LocataireTable"
import { LocataireSearch } from "@/components/organisms/LocataireSearch"
import { LocataireFilters } from "@/components/organisms/LocataireFilters"
import { LocataireForm } from "@/components/organisms/LocataireForm"
import { LocataireModal } from "@/components/organisms/LocataireModal"
import { DisableLocataireModal } from "@/components/organisms/DisableLocataireModal"

export default function LocatairePage() {
  const { t } = useTranslation()
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
        if (c.statut === 'ACTIF' || c.statut === 'EN_ATTENTE') {
          bMap[c.locataire] = (bMap[c.locataire] || 0) + 1
        }
      }
    })
    return { contratsCountMap: cMap, biensCountMap: bMap }
  }, [contrats])

  const openEditModal = (loc: Locataire) => {
    setEditingLoc(loc)
    setShowForm(true)
  }

  const openCreateModal = () => {
    setEditingLoc(null)
    setShowForm(true)
  }

  return (
    <>
      <div className="welcome-row mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("admin.locataires.title_start", "Gestion des")}{" "}
            <span className="text-slate-900 dark:text-white font-extrabold">{t("admin.locataires.title_highlight", "Locataires")}</span>
          </h1>
          <p className="subtitle text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("admin.locataires.subtitle", "Gérez les locataires, leurs contrats, leurs accès et consultez l'historique de leurs locations.")}
          </p>
        </div>
        <button className="primary-button flex items-center gap-2" onClick={openCreateModal}>
          <Plus size={16} /> {t("admin.locataires.add_tenant", "Ajouter un locataire")}
        </button>
      </div>

      <section className="panel user-panel flex-1 flex flex-col">
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

      {viewLoc && (
        <LocataireModal 
          locataire={viewLoc} 
          contrats={contrats.filter(c => c.locataire === viewLoc.id)}
          paiements={paiements.filter(p => {
            const contrat = contrats.find(c => c.id === p.contrat)
            return contrat?.locataire === viewLoc.id
          })}
          onClose={() => setViewLoc(null)} 
        />
      )}

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
