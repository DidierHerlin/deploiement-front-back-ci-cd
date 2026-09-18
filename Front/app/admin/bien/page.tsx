'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { 
  getBiens, createBien, updateBien, deleteBien, getProprietaires,
  Bien, Proprietaire 
} from '@/lib/api'

import { BienTable } from './components/BienTable'
import { BienSearch } from './components/BienSearch'
import { BienFilters } from './components/BienFilters'
import { BienForm } from './components/BienForm'
import { BienModal } from './components/BienModal'
import { DeleteBienModal } from './components/DeleteBienModal'

export default function BienPage() {
  const [biens, setBiens] = useState<Bien[]>([])
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters state
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('Tous')
  const [operationFilter, setOperationFilter] = useState('Toutes')
  const [statutFilter, setStatutFilter] = useState('Tous')
  const [proprietaireFilter, setProprietaireFilter] = useState('Tous')
  
  // Modals state
  const [showForm, setShowForm] = useState(false)
  const [editingBien, setEditingBien] = useState<Bien | null>(null)
  const [viewBien, setViewBien] = useState<Bien | null>(null)
  const [bienToDelete, setBienToDelete] = useState<number | null>(null)

  const defaultNewBien: Partial<Bien> = { 
    titre: '', type: 'APPARTEMENT', mode_transaction: 'LOCATION', statut: 'DISPONIBLE', 
    adresse: '', surface: 0, nombre_pieces: 0, loyer_mensuel: '', prix: '' 
  }
  const [newBien, setNewBien] = useState<Partial<Bien>>(defaultNewBien)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [biensData, propsData] = await Promise.all([
        getBiens(),
        getProprietaires()
      ])
      setBiens(biensData)
      setProprietaires(propsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredBiens = useMemo(() => {
    return biens.filter((bien) => {
      const matchQuery = bien.titre.toLowerCase().includes(query.toLowerCase()) || 
                         bien.adresse.toLowerCase().includes(query.toLowerCase())
      
      const matchType = typeFilter === 'Tous' || bien.type === typeFilter
      const matchOp = operationFilter === 'Toutes' || bien.mode_transaction === operationFilter
      const matchStatut = statutFilter === 'Tous' || bien.statut === statutFilter
      const matchProp = proprietaireFilter === 'Tous' || bien.proprietaire?.id.toString() === proprietaireFilter
      
      return matchQuery && matchType && matchOp && matchStatut && matchProp
    })
  }, [biens, query, typeFilter, operationFilter, statutFilter, proprietaireFilter])

  async function handleSaveBien(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: any = { ...newBien }
      
      // Conversion de `proprietaire` en `proprietaire_id` pour le serializer Django
      if (payload.proprietaire) {
        payload.proprietaire_id = typeof payload.proprietaire === 'object' ? payload.proprietaire.id : payload.proprietaire
        delete payload.proprietaire
      }
      
      // Nettoyage du payload selon le type
      if (payload.type === 'TERRAIN') payload.nombre_pieces = null
      if (payload.mode_transaction === 'LOCATION') payload.prix = null
      if (payload.mode_transaction === 'VENTE') payload.loyer_mensuel = null

      if (editingBien) {
        await updateBien(editingBien.id, payload)
      } else {
        await createBien(payload)
      }
      
      await fetchData()
      setShowForm(false)
      setEditingBien(null)
      setNewBien(defaultNewBien)
    } catch (error: any) {
      alert("Erreur lors de l'enregistrement: " + error.message)
    }
  }

  function openEditModal(bien: Bien) {
    setEditingBien(bien)
    setNewBien({
      ...bien,
      proprietaire: bien.proprietaire?.id as any
    })
    setShowForm(true)
  }

  async function confirmDelete() {
    if (!bienToDelete) return
    try {
      await deleteBien(bienToDelete)
      await fetchData()
      setBienToDelete(null)
    } catch (e: any) {
      alert("Erreur lors de la suppression: " + e.message)
    }
  }

  const handleCreateClick = () => {
    setEditingBien(null)
    setNewBien(defaultNewBien)
    setShowForm(true)
  }

  return (
    <>
      <div className="welcome-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1>Gestion des <span>Biens immobiliers</span></h1>
          <p className="subtitle">Administrez votre parc immobilier, suivez les statuts et ajoutez de nouvelles propriétés.</p>
        </div>
        <button className="primary-button" onClick={handleCreateClick}>
          <Plus size={16} /> Ajouter un bien
        </button>
      </div>

      <section className="panel user-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="user-toolbar">
          <BienSearch query={query} onQueryChange={setQuery} />
          <BienFilters 
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            statutFilter={statutFilter} setStatutFilter={setStatutFilter}
            operationFilter={operationFilter} setOperationFilter={setOperationFilter}
            proprietaireFilter={proprietaireFilter} setProprietaireFilter={setProprietaireFilter}
            proprietaires={proprietaires}
          />
        </div>
        
        <BienTable 
          biens={filteredBiens} 
          loading={loading} 
          onView={setViewBien} 
          onEdit={openEditModal} 
          onDelete={setBienToDelete} 
        />
      </section>

      {showForm && (
        <BienForm 
          editingBien={editingBien} 
          newBien={newBien} 
          setNewBien={setNewBien} 
          proprietaires={proprietaires}
          onClose={() => setShowForm(false)} 
          onSubmit={handleSaveBien} 
        />
      )}

      {viewBien && (
        <BienModal 
          bien={viewBien} 
          onClose={() => setViewBien(null)} 
          onEdit={() => { setViewBien(null); openEditModal(viewBien); }} 
        />
      )}

      {bienToDelete && (
        <DeleteBienModal 
          onCancel={() => setBienToDelete(null)} 
          onConfirm={confirmDelete} 
        />
      )}
    </>
  )
}
