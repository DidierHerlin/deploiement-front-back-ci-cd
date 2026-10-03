'use client'

import { useState } from 'react'
import { MapPin, Maximize, DoorOpen, Tag, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { BienListItem, resolveMediaUrl } from '@/lib/api'
import Image from 'next/image'

interface BienCardProps {
  bien: BienListItem
  onReserver: (bien: BienListItem) => void
}

export default function BienCard({ bien, onReserver }: BienCardProps) {
  const isLocation = bien.mode_transaction === 'LOCATION'
  const [photoIndex, setPhotoIndex] = useState(0)

  const typeLabel = (() => {
    switch (bien.type) {
      case 'APPARTEMENT': return 'Appartement'
      case 'MAISON': return 'Maison'
      case 'LOCAL_COMMERCIAL': return 'Local commercial'
      case 'TERRAIN': return 'Terrain'
      default: return bien.type
    }
  })()

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bien.photos) setPhotoIndex((prev) => (prev + 1) % bien.photos.length)
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bien.photos) setPhotoIndex((prev) => (prev - 1 + bien.photos.length) % bien.photos.length)
  }

  return (
    <div className="panel group" style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', padding: 0 }}>
      <div style={{ position: 'relative', width: '100%', height: 180, background: '#f1f5f9', flexShrink: 0, overflow: 'hidden' }}>
        {bien.photos && bien.photos.length > 0 ? (
          <>
            <Image
              src={resolveMediaUrl(bien.photos[photoIndex])!}
              alt={bien.titre}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {bien.photos.length > 1 && (
              <>
                <button 
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-sm"
                  style={{ border: 'none', cursor: 'pointer', zIndex: 10 }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-sm"
                  style={{ border: 'none', cursor: 'pointer', zIndex: 10 }}
                >
                  <ChevronRight size={18} />
                </button>
                
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5" style={{ zIndex: 10 }}>
                  {bien.photos.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all ${idx === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <MapPin size={28} strokeWidth={1.2} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px 16px' }}>
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--muted-foreground)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={13} /> {typeLabel}</span>
        {bien.surface && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Maximize size={13} /> {bien.surface} m²</span>}
        {bien.nombre_pieces && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DoorOpen size={13} /> {bien.nombre_pieces} pièce(s)</span>}
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
        {isLocation
          ? `${Number(bien.loyer_mensuel || 0).toLocaleString()} Ar / mois`
          : `${Number(bien.prix || 0).toLocaleString()} Ar`
        }
      </div>

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
    </div>
  )
}
