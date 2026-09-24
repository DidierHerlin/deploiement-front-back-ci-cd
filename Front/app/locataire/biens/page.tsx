'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { Search, Building2, Check } from 'lucide-react'
import { getProfil, getBiensDisponibles, BienListItem } from '@/lib/api'

import { LocataireSidebar } from "@/components/organisms/LocataireSidebar"
import { LocataireTopbar } from "@/components/organisms/LocataireTopbar"
import { ProfileModal } from "@/components/organisms/ProfileModal"
import BienCard from "@/components/molecules/biens_BienCard"
import ReservationModal from "@/components/organisms/ReservationModal"

export default function BiensDisponiblesPage() {
  const [user, setUser] = useState<any>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const [biens, setBiens] = useState<BienListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('Tous')

  const [selectedBien, setSelectedBien] = useState<BienListItem | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getProfil().then(setUser).catch(console.error)
    fetchBiens()
  }, [])

  const fetchBiens = () => {
    setLoading(true)
    getBiensDisponibles()
      .then(setBiens)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const filtered = biens.filter((b) => {
    const matchSearch = `${b.titre} ${b.adresse}`.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'Tous' || b.mode_transaction === filterType
    return matchSearch && matchType
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="app-shell">
      <LocataireSidebar
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        activeHref="/locataire/biens"
        user={user}
      />

      <main className="main-content">
        <LocataireTopbar
          setMobileNav={setMobileNav}
          setShowProfile={setShowProfile}
          activeLabel="Biens disponibles"
          user={user}
        />

        <div className="page-body">
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p className="section-kicker">BIENS DISPONIBLES</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Explorer les biens</h1>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
              Consultez les biens disponibles et soumettez une réservation.
            </p>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un bien..."
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13 }}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13 }}
            >
              <option value="Tous">Tous les types</option>
              <option value="LOCATION">Location</option>
              <option value="VENTE">Vente</option>
            </select>
          </div>

          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            {filtered.length} bien(s) disponible(s)
          </p>

          {/* Content */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p>Chargement des biens disponibles...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}>
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
              <Building2 size={40} style={{ margin: '0 auto 12px', color: 'var(--muted-foreground)' }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>Aucun bien disponible</p>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                Il n'y a actuellement aucun bien correspondant à votre recherche.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {filtered.map((bien) => (
                <BienCard key={bien.id} bien={bien} onReserver={setSelectedBien} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de réservation */}
      {selectedBien && (
        <ReservationModal
          bien={selectedBien}
          onClose={() => setSelectedBien(null)}
          onSuccess={() => {
            setSelectedBien(null)
            showToast('Réservation soumise avec succès !')
            fetchBiens()
          }}
        />
      )}

      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} onProfileUpdated={(res) => setUser(res.user)} />
      )}

      {toast && (
        <div className="toast" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100, display: 'flex', alignItems: 'center', gap: 8, background: '#166534', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <Check size={16} /> {toast}
        </div>
      )}
    </div>
  )
}
