'use client'
import { Building2, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Property } from '../types'

function statusClass(status: string) {
  const s = status.toLowerCase()
  if (s.includes('disponible')) return 'disponible'
  if (s.includes('lou')) return 'loue'
  if (s.includes('travaux')) return 'en-travaux'
  if (s.includes('réserv') || s.includes('reserv')) return 'reserve'
  if (s.includes('vendu')) return 'vendu'
  return 'neutre'
}

function PropertyVisual({ color }: { color: string }) {
  return (
    <div className={`agent-visual ${color}`}>
      <Building2 size={34} strokeWidth={1.3} />
      <span>HABITAT COLLECTION</span>
    </div>
  )
}

export default function PropertyCard({ property, onEdit, onDelete }: { property: Property; onEdit: () => void; onDelete: () => void }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const photos = property.photos ?? []
  const hasPhotos = photos.length > 0

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasPhotos) setPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasPhotos) setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const rentNum = Number(String(property.rent).replace(/\s/g, ''))
  const rentLabel = property.rent && !isNaN(rentNum)
    ? rentNum.toLocaleString('fr-FR')
    : property.rent
  const isSale = property.status === 'Vendu' || property.status === 'Réservé'

  return (
    <article className="agent-card">
      <div className="agent-card-media">
        {hasPhotos ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[photoIndex]} alt={`Photo de ${property.title}`} />
            {photos.length > 1 && (
              <>
                <button className="agent-photo-nav prev" onClick={prevPhoto} aria-label="Photo précédente">‹</button>
                <button className="agent-photo-nav next" onClick={nextPhoto} aria-label="Photo suivante">›</button>
                <span className="agent-photo-count">{photoIndex + 1}/{photos.length}</span>
              </>
            )}
          </>
        ) : (
          <PropertyVisual color={property.color} />
        )}
        <span className={`agent-status ${statusClass(property.status)}`}>{property.status}</span>
      </div>
      <div className="agent-card-body">
        <div className="agent-card-top">
          <div style={{ minWidth: 0 }}>
            <h3>{property.title}</h3>
            <p>{property.address}</p>
          </div>
          <span className="agent-type">{property.type}</span>
        </div>
        <div className="agent-card-meta">
          <span>{property.surface ? `${property.surface} m²` : '—'}</span>
          <span>{property.rooms ? `${property.rooms} pièce${property.rooms !== '1' ? 's' : ''}` : '—'}</span>
          <span className="price">
            {rentLabel ? `${rentLabel} Ar` : 'Prix N/A'}
            {!isSale && rentLabel ? <small> / mois</small> : null}
          </span>
        </div>
        <div className="agent-card-actions">
          <button className="agent-btn agent-btn-ghost grow" onClick={onEdit}><Pencil size={14} /> Modifier</button>
          <button
            className="agent-btn agent-btn-danger-ghost"
            onClick={() => { if (window.confirm(`Supprimer « ${property.title} » du parc ?`)) onDelete() }}
            aria-label={`Supprimer ${property.title}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}
