'use client'

import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import type { Property } from './types'
import type { FormData } from './components/PropertyModal'

import BiensHeader from './components/BiensHeader'
import BiensToolbar from './components/BiensToolbar'
import BiensSummary from './components/BiensSummary'
import PropertiesGrid from './components/PropertiesGrid'
import PropertyModal from './components/PropertyModal'
import BiensFooter from './components/BiensFooter'

const initialProperties: Property[] = [
  { id: 1, title: 'Appartement lumineux', address: '24 rue de Charonne, 75011 Paris',   type: 'Appartement', surface: '64',  rooms: '3', rent: '1 420', charges: '120', status: 'Loué',       color: 'sage',  description: 'Bel appartement traversant avec balcon.' },
  { id: 2, title: 'Studio haussmannien',  address: '18 rue du Bac, 75007 Paris',         type: 'Studio',      surface: '28',  rooms: '1', rent: '820',   charges: '70',  status: 'Disponible', color: 'sand',  description: 'Studio rénové au cœur du 7e arrondissement.' },
  { id: 3, title: 'Maison avec jardin',   address: '6 avenue Mozart, 78000 Versailles',  type: 'Maison',      surface: '128', rooms: '5', rent: '2 650', charges: '180', status: 'Loué',       color: 'blue',  description: 'Maison familiale calme avec jardin arboré.' },
  { id: 4, title: 'Loft atelier',         address: '42 rue Oberkampf, 75011 Paris',      type: 'Loft',        surface: '92',  rooms: '4', rent: '1 980', charges: '150', status: 'En travaux', color: 'clay',  description: 'Volumes généreux, travaux de rafraîchissement en cours.' },
  { id: 5, title: 'T2 avec terrasse',     address: '9 avenue Daumesnil, 75012 Paris',    type: 'Appartement', surface: '48',  rooms: '2', rent: '1 180', charges: '95',  status: 'Loué',       color: 'olive', description: 'T2 calme avec terrasse privative.' },
  { id: 6, title: 'Appartement familial', address: '31 rue Vaneau, 75006 Paris',         type: 'Appartement', surface: '78',  rooms: '4', rent: '1 760', charges: '140', status: 'Disponible', color: 'cream', description: 'Appartement spacieux proche des écoles et commerces.' },
]

import { useEffect } from 'react'
import { getBiens, createBien, updateBien, deleteBien } from '@/lib/api'

export default function AgentBiensPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Tous les statuts')
  const [type, setType] = useState('Tous les types')
  const [modal, setModal] = useState<'new' | Property | null>(null)
  const [toast, setToast] = useState('')

  const fetchProperties = () => {
    setLoading(true)
    setLoadError(null)
    getBiens().then(data => {
      setProperties(data.map((b, i) => {
        const tones = ['sage', 'sand', 'blue', 'clay', 'olive', 'cream']
        let frontendType = 'Appartement'
        if (b.type === 'MAISON') frontendType = 'Maison'
        else if (b.type === 'LOCAL_COMMERCIAL') frontendType = 'Bureau'
        else if (b.type === 'TERRAIN') frontendType = 'Terrain'
        else if (b.type) frontendType = b.type.charAt(0).toUpperCase() + b.type.slice(1).toLowerCase()

        return {
          id: b.id,
          title: b.titre || '',
          address: b.adresse || '',
          type: frontendType,
          surface: b.surface != null ? String(b.surface) : '',
          rooms: b.nombre_pieces != null ? String(b.nombre_pieces) : '',
          rent: b.loyer_mensuel != null ? String(b.loyer_mensuel) : (b.prix != null ? String(b.prix) : ''),
          charges: (b as any).charges != null ? String((b as any).charges) : '',
          status: b.statut === 'DISPONIBLE' ? 'Disponible' : b.statut === 'LOUE' ? 'Loué' : b.statut === 'RESERVE' ? 'Réservé' : b.statut === 'EN_TRAVAUX' ? 'En travaux' : 'Vendu',
          color: tones[i % tones.length],
          proprietaire: b.proprietaire?.id || undefined,
          photos: b.photos || []
        }
      }))
    }).catch((e) => setLoadError(e.message || 'Chargement impossible')).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const filtered = useMemo(
    () => properties
      .filter(
        (item) =>
          `${item.title} ${item.address}`.toLowerCase().includes(search.toLowerCase()) &&
          (status === 'Tous les statuts' || item.status === status) &&
          (type === 'Tous les types' || item.type === type),
      )
      .sort((a, b) => {
        if (a.status === 'Disponible' && b.status !== 'Disponible') return -1;
        if (a.status !== 'Disponible' && b.status === 'Disponible') return 1;
        return 0;
      }),
    [properties, search, status, type],
  )

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const save = async (data: FormData) => {
    if (!data.proprietaire) {
      showToast('Erreur : Veuillez sélectionner un propriétaire.')
      return
    }

    let backendType = 'APPARTEMENT'
    if (data.type === 'Maison' || data.type === 'Loft') backendType = 'MAISON'
    else if (data.type === 'Bureau') backendType = 'LOCAL_COMMERCIAL'
    else if (data.type === 'Terrain') backendType = 'TERRAIN'

    const payload = {
      titre: data.title,
      adresse: data.address,
      type: backendType,
      surface: data.surface ? parseInt(data.surface, 10) : 0, // Assuming surface is required by backend
      nombre_pieces: data.rooms ? parseInt(data.rooms, 10) : null,
      loyer_mensuel: data.rent ? data.rent : null,
      statut: (data.status === 'Disponible' ? 'DISPONIBLE' : data.status === 'Loué' ? 'LOUE' : data.status === 'Réservé' ? 'RESERVE' : data.status === 'En travaux' ? 'EN_TRAVAUX' : 'VENDU') as "DISPONIBLE" | "LOUE" | "VENDU" | "EN_TRAVAUX" | "RESERVE",
      proprietaire_id: data.proprietaire,
      photos: data.photos || [],
      mode_transaction: (data.status === 'Vendu' ? 'VENTE' : 'LOCATION') as "VENTE" | "LOCATION"
    }
    
    // Gérer les champs prix et loyer selon le mode
    if (payload.mode_transaction === 'VENTE') {
      (payload as any).prix = payload.loyer_mensuel;
      payload.loyer_mensuel = null;
    } else {
      // Pour une LOCATION, on doit s'assurer de vider le prix s'il existait
      (payload as any).prix = null;
    }

    try {
      if (modal && modal !== 'new') {
        await updateBien((modal as Property).id, payload)
        showToast('Bien modifié avec succès')
      } else {
        await createBien(payload)
        showToast('Nouveau bien ajouté au parc')
      }
      setModal(null)
      fetchProperties()
    } catch (e: any) {
      alert('Erreur lors de la sauvegarde: ' + e.message)
      showToast('Erreur lors de la sauvegarde.')
    }
  }

  const remove = async (id: number) => {
    try {
      await deleteBien(id)
      setProperties((items) => items.filter((item) => item.id !== id))
      showToast('Bien supprimé du parc')
    } catch {
      setProperties((items) => items.filter((item) => item.id !== id))
      showToast('Bien retiré localement (API indisponible)')
    }
  }

  if (loading) {
    return (
      <>
        <BiensHeader onAdd={() => setModal('new')} />
        <div className="agent-skeleton-grid" aria-label="Chargement des biens">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="agent-skeleton" key={i}>
              <div className="sk-media" />
              <div className="sk-body">
                <div className="sk-line" style={{ width: '70%' }} />
                <div className="sk-line" style={{ width: '90%' }} />
                <div className="sk-line" style={{ width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (loadError) {
    return (
      <>
        <BiensHeader onAdd={() => setModal('new')} />
        <div className="agent-empty">
          <h2>Impossible de charger les biens</h2>
          <p>{loadError}</p>
          <button className="agent-btn agent-btn-primary" onClick={fetchProperties}>Réessayer</button>
        </div>
      </>
    )
  }

  return (
    <>
      <BiensHeader onAdd={() => setModal('new')} />

      <BiensToolbar
        search={search} setSearch={setSearch}
        status={status} setStatus={setStatus}
        type={type} setType={setType}
      />

      <BiensSummary displayedCount={filtered.length} totalCount={properties.length} />

      <PropertiesGrid properties={filtered} onEdit={setModal} onDelete={remove} />

      {modal && <PropertyModal property={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={save} />}

      <BiensFooter />

      {toast && <div className="agent-toast"><Check size={16} /> {toast}</div>}
    </>
  )
}
