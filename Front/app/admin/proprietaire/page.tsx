'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { 
  getProprietaires, createProprietaire, updateProprietaire, 
  getBiens, updateBien, Proprietaire, Bien
} from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

import { ProprietaireTable } from "@/components/organisms/ProprietaireTable"
import { ProprietaireSearch } from "@/components/organisms/ProprietaireSearch"
import { ProprietaireFilters } from "@/components/organisms/ProprietaireFilters"
import { ProprietaireForm } from "@/components/organisms/ProprietaireForm"
import { ProprietaireModal } from "@/components/organisms/ProprietaireModal"
import { DisableProprietaireModal } from "@/components/organisms/DisableProprietaireModal"
import { ProprietaireBienTable } from "@/components/organisms/ProprietaireBienTable"
import { AssignBienModal } from "@/components/organisms/AssignBienModal"
import { updateUser } from '@/lib/api'

export default function ProprietairePage() {
  const { t } = useTranslation()
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([])
  const [biens, setBiens] = useState<Bien[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtres & Recherche
  const [query, setQuery] = useState('')
  const [statutFilter, setStatutFilter] = useState('Tous')
  
  // Modals state
  const [showForm, setShowForm] = useState(false)
  const [editingProp, setEditingProp] = useState<Proprietaire | null>(null)
  
  const [viewProp, setViewProp] = useState<Proprietaire | null>(null)
  const [disableProp, setDisableProp] = useState<Proprietaire | null>(null)
  
  const [showBiensFor, setShowBiensFor] = useState<Proprietaire | null>(null)
  const [showAssignBienFor, setShowAssignBienFor] = useState<Proprietaire | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [propsData, biensData] = await Promise.all([
        getProprietaires(),
        getBiens()
      ])
      setProprietaires(propsData)
      setBiens(biensData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // RG-04 Disable logic: Patch the User model to is_active=false instead of deleting Proprietaire
  async function handleDisableConfirm() {
    if (!disableProp) return
    try {
      await updateUser(disableProp.user.id, { is_active: false })
      await fetchData()
      setDisableProp(null)
    } catch (error: any) {
      alert("Erreur lors de la désactivation: " + error.message)
    }
  }

  async function handleFormSubmit(payload: any) {
    if (editingProp) {
      await updateProprietaire(editingProp.id, payload)
    } else {
      await createProprietaire(payload)
    }
    await fetchData()
    setShowForm(false)
  }

  async function handleAssignBien(bienId: number) {
    if (!showAssignBienFor) return
    // Règle RG-08: Transfert de propriétaire
    // Le backend de Bien attend `proprietaire_id` pour la mise à jour
    try {
      await updateBien(bienId, { proprietaire_id: showAssignBienFor.id } as any)
      await fetchData()
      setShowAssignBienFor(null)
    } catch (error: any) {
      alert("Erreur lors de l'association: " + error.message)
    }
  }

  // Filtres
  const filteredProps = useMemo(() => {
    return proprietaires.filter(p => {
      const u = p.user
      const searchStr = `${u.nom} ${u.prenoms} ${u.email} ${u.telephone || ''} ${p.iban || ''}`.toLowerCase()
      const matchQuery = searchStr.includes(query.toLowerCase())
      
      const isActive = u.is_active ?? true
      let matchStatut = true
      if (statutFilter === 'Actif') matchStatut = isActive
      if (statutFilter === 'Désactivé') matchStatut = !isActive
      
      return matchQuery && matchStatut
    })
  }, [proprietaires, query, statutFilter])

  // Count biens per proprietaire
  const biensCountMap = useMemo(() => {
    const map: Record<number, number> = {}
    biens.forEach(b => {
      if (b.proprietaire) {
        map[b.proprietaire.id] = (map[b.proprietaire.id] || 0) + 1
      }
    })
    return map
  }, [biens])

  const openEditModal = (p: Proprietaire) => {
    setEditingProp(p)
    setShowForm(true)
  }

  const openCreateModal = () => {
    setEditingProp(null)
    setShowForm(true)
  }

  return (
    <>
      <div className="welcome-row mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("admin.proprietaires.title_start", "Gestion des")}{" "}
            <span className="text-slate-500 dark:text-slate-200 font-semibold">{t("admin.proprietaires.title_highlight", "Propriétaires")}</span>
          </h1>
          <p className="subtitle text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("admin.proprietaires.subtitle", "Administrez les comptes propriétaires, attribuez des rôles exclusifs et gérez leurs biens.")}
          </p>
        </div>
        <button className="primary-button flex items-center gap-2" onClick={openCreateModal}>
          <Plus size={16} /> {t("admin.proprietaires.add_owner", "Ajouter un propriétaire")}
        </button>
      </div>

      <section className="panel user-panel flex-1 flex flex-col">
        <div className="user-toolbar">
          <ProprietaireSearch query={query} onQueryChange={setQuery} />
          <ProprietaireFilters statutFilter={statutFilter} setStatutFilter={setStatutFilter} />
        </div>
        
        <ProprietaireTable 
          proprietaires={filteredProps} 
          loading={loading} 
          biensCountMap={biensCountMap}
          onView={setViewProp} 
          onEdit={openEditModal} 
          onDisable={setDisableProp} 
        />
      </section>

      {showForm && (
        <ProprietaireForm 
          editingProp={editingProp} 
          onClose={() => setShowForm(false)} 
          onSubmit={handleFormSubmit} 
        />
      )}

      {viewProp && (
        <ProprietaireModal 
          proprietaire={viewProp} 
          onClose={() => setViewProp(null)} 
          onManageBiens={() => { setViewProp(null); setShowBiensFor(viewProp); }}
        />
      )}

      {disableProp && (
        <DisableProprietaireModal 
          proprietaire={disableProp} 
          onCancel={() => setDisableProp(null)} 
          onConfirm={handleDisableConfirm} 
        />
      )}

      {showBiensFor && (
        <ProprietaireBienTable 
          biens={biens.filter(b => b.proprietaire?.id === showBiensFor.id)}
          onClose={() => setShowBiensFor(null)}
          onAssignClick={() => setShowAssignBienFor(showBiensFor)}
        />
      )}

      {showAssignBienFor && (
        <AssignBienModal 
          targetProprietaire={showAssignBienFor}
          allBiens={biens}
          onClose={() => setShowAssignBienFor(null)}
          onAssign={handleAssignBien}
        />
      )}
    </>
  )
}
