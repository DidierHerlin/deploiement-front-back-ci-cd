'use client'

import { useState, useEffect } from 'react'
import { Plus, Download } from 'lucide-react'
import { getBiens, Bien } from '@/lib/api'
import { BienList } from "@/components/organisms/BienList"
import { BienForm } from "@/components/organisms/bien_BienForm"

export function BiensPage() {
  const [biens, setBiens] = useState<Bien[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBien, setEditingBien] = useState<Bien | undefined>(undefined)

  const [filterStatut, setFilterStatut] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  const fetchBiens = async () => {
    try {
      setLoading(true)
      const data = await getBiens()
      setBiens(data)
    } catch (err) {
      console.error("Erreur chargement biens", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBiens()
  }, [])

  const handleAdd = () => {
    setEditingBien(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (bien: Bien) => {
    setEditingBien(bien)
    setIsFormOpen(true)
  }

  const handleCloseForm = (refresh?: boolean) => {
    setIsFormOpen(false)
    setEditingBien(undefined)
    if (refresh) {
      fetchBiens()
    }
  }

  // Déduire les options uniques dynamiquement d'après la base (les biens chargés)
  const uniqueTypes = Array.from(new Set(biens.map(b => b.type))).sort()
  const uniqueStatuts = Array.from(new Set(biens.map(b => b.statut))).sort()

  const filteredBiens = biens.filter(bien => {
    if (filterStatut && bien.statut !== filterStatut) return false
    if (filterType && bien.type !== filterType) return false
    return true
  }).sort((a, b) => {
    // Afficher en premier les biens 'DISPONIBLE'
    if (a.statut === 'DISPONIBLE' && b.statut !== 'DISPONIBLE') return -1;
    if (a.statut !== 'DISPONIBLE' && b.statut === 'DISPONIBLE') return 1;
    return 0;
  })

  // Helper pour afficher le type de manière lisible
  const formatType = (t: string) => {
    const map: Record<string, string> = { 'APPARTEMENT': 'Appartement', 'MAISON': 'Maison', 'TERRAIN': 'Terrain', 'COMMERCE': 'Commerce', 'BUREAU': 'Bureau' }
    return map[t] || t
  }

  // Helper pour afficher le statut de manière lisible
  const formatStatut = (s: string) => {
    const map: Record<string, string> = { 'DISPONIBLE': 'Disponible', 'LOUE': 'Loué', 'VENDU': 'Vendu', 'EN_TRAVAUX': 'En travaux' }
    return map[s] || s
  }

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MES BIENS IMMOBILIERS</p>
          <h1>Gérez <span>votre patrimoine.</span></h1>
          <p className="subtitle">Consultez, ajoutez ou modifiez vos biens immobiliers.</p>
        </div>
        <div className="flex gap-3">
          <button className="primary-button" onClick={handleAdd}>
            <Plus size={16} /> Ajouter un bien
          </button>
        </div>
      </div>

      <section className="panel mt-6">
        <div className="panel-header flex-col md:flex-row gap-4" style={{ marginBottom: '20px' }}>
          <div>
            <h2>Liste de vos biens</h2>
            <p>Retrouvez tous les biens associés à votre compte.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-600 bg-white"
            >
              <option value="">Tous les types</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{formatType(t)}</option>)}
            </select>
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
          <div className="p-8 text-center text-[#8993a3]">Chargement de vos biens...</div>
        ) : (
          <BienList biens={filteredBiens} onEdit={handleEdit} onRefresh={fetchBiens} />
        )}
      </section>

      {isFormOpen && (
        <BienForm 
          bien={editingBien} 
          onClose={handleCloseForm} 
        />
      )}
    </>
  )
}
