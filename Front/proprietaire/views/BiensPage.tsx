'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { getBiens, Bien } from '@/lib/api'
import { BienList } from "@/components/organisms/BienList"
import { BienForm } from "@/components/organisms/BienForm"
import { useTranslation } from '@/lib/i18n'

export function BiensPage() {
  const { t } = useTranslation()
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

  const uniqueTypes = Array.from(new Set(biens.map(b => b?.type).filter(Boolean))).sort()
  const uniqueStatuts = Array.from(new Set(biens.map(b => b?.statut).filter(Boolean))).sort()

  const filteredBiens = biens.filter(bien => {
    if (filterStatut && bien?.statut !== filterStatut) return false
    if (filterType && bien?.type !== filterType) return false
    return true
  }).sort((a, b) => {
    if (a.statut === 'DISPONIBLE' && b.statut !== 'DISPONIBLE') return -1;
    if (a.statut !== 'DISPONIBLE' && b.statut === 'DISPONIBLE') return 1;
    return 0;
  })

  const formatType = (tp: string) => {
    switch (tp) {
      case 'APPARTEMENT': return t("types.apartment", "Appartement")
      case 'MAISON': return t("types.house", "Maison")
      case 'TERRAIN': return t("types.land", "Terrain")
      case 'COMMERCE': return t("types.commercial", "Commerce")
      case 'BUREAU': return t("types.commercial", "Bureau")
      default: return tp
    }
  }

  const formatStatut = (s: string) => {
    switch (s) {
      case 'DISPONIBLE': return t("dashboard.common.status_disponible", "Disponible")
      case 'LOUE': return t("dashboard.common.status_loue", "Loué")
      case 'VENDU': return t("dashboard.common.status_vendu", "Vendu")
      case 'EN_TRAVAUX': return t("dashboard.common.status_en_travaux", "En travaux")
      default: return s
    }
  }

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{t("proprietaire_pages.biens.eyebrow", "MES BIENS IMMOBILIERS")}</p>
          <h1>{t("proprietaire_pages.biens.title_main", "Gérez")} <span>{t("proprietaire_pages.biens.title_highlight", "votre patrimoine.")}</span></h1>
          <p className="subtitle">{t("proprietaire_pages.biens.subtitle", "Consultez, ajoutez ou modifiez vos biens immobiliers.")}</p>
        </div>
        <div className="flex gap-3">
          <button className="primary-button cursor-pointer" onClick={handleAdd}>
            <Plus size={16} /> {t("proprietaire_pages.biens.add_btn", "Ajouter un bien")}
          </button>
        </div>
      </div>

      <section className="panel mt-6">
        <div className="panel-header flex-col md:flex-row gap-4" style={{ marginBottom: '20px' }}>
          <div>
            <h2>{t("proprietaire_pages.biens.list_title", "Liste de vos biens")}</h2>
            <p>{t("proprietaire_pages.biens.list_sub", "Retrouvez tous les biens associés à votre compte.")}</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="">{t("proprietaire_pages.biens.filter_types", "Tous les types")}</option>
              {uniqueTypes.map(tp => <option key={tp} value={tp}>{formatType(tp)}</option>)}
            </select>
            <select 
              value={filterStatut} 
              onChange={(e) => setFilterStatut(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="">{t("proprietaire_pages.biens.filter_status", "Tous les statuts")}</option>
              {uniqueStatuts.map(s => <option key={s} value={s}>{formatStatut(s)}</option>)}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-[#8993a3]">{t("proprietaire_pages.biens.loading", "Chargement de vos biens...")}</div>
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
