'use client'

import { MapPin, Maximize, DoorOpen, Tag, CalendarPlus } from 'lucide-react'
import { BienListItem } from '@/lib/api'

interface BienCardProps {
  bien: BienListItem
  onReserver: (bien: BienListItem) => void
}

export default function BienCard({ bien, onReserver }: BienCardProps) {
  const isLocation = bien.mode_transaction === 'LOCATION'

  const typeLabel = (() => {
    switch (bien.type) {
      case 'APPARTEMENT': return 'Appartement'
      case 'MAISON': return 'Maison'
      case 'LOCAL_COMMERCIAL': return 'Local commercial'
      case 'TERRAIN': return 'Terrain'
      default: return bien.type
    }
  })()

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{bien.titre}</h3>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} /> {bien.adresse}
          </p>
        </div>
        <span style={{
          padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
          background: isLocation ? '#dbeafe' : '#fef3c7',
          color: isLocation ? '#1e40af' : '#92400e',
        }}>
          {isLocation ? 'Location' : 'Vente'}
        </span>
      </div>

      {/* Infos */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--muted-foreground)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={13} /> {typeLabel}</span>
        {bien.surface && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Maximize size={13} /> {bien.surface} m²</span>}
        {bien.nombre_pieces && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DoorOpen size={13} /> {bien.nombre_pieces} pièce(s)</span>}
      </div>

      {/* Prix */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
        {isLocation
          ? `${Number(bien.loyer_mensuel || 0).toLocaleString()} Ar / mois`
          : `${Number(bien.prix || 0).toLocaleString()} Ar`
        }
      </div>

      {/* Bouton Réserver */}
      <button
        onClick={() => onReserver(bien)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 8, border: 'none',
          background: 'var(--primary)', color: 'var(--primary-foreground)',
          cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 'auto',
        }}
      >
        <CalendarPlus size={16} />
        Réserver
      </button>
    </div>
  )
}
