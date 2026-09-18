'use client'
import { useState } from 'react'
import { Building2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Property } from '../types'

function PropertyVisual({ color }: { color: string }) {
  return (
    <div className={`property-visual ${color}`}>
      <Building2 size={36} strokeWidth={1.2} />
      <span>HABITAT COLLECTION</span>
    </div>
  )
}

export default function PropertyCard({ property, onEdit, onDelete }: { property: Property; onEdit: () => void; onDelete: () => void }) {
  const [photoIndex, setPhotoIndex] = useState(0)

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (property.photos && property.photos.length > 0) {
      setPhotoIndex((prev) => (prev + 1) % property.photos!.length)
    }
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (property.photos && property.photos.length > 0) {
      setPhotoIndex((prev) => (prev - 1 + property.photos!.length) % property.photos!.length)
    }
  }

  return (
    <article className="property-card">
      <div className="property-image" style={{ position: 'relative', overflow: 'hidden' }}>
        {property.photos && property.photos.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={property.photos[photoIndex]} 
              alt={`Photo de ${property.title}`} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            
            {property.photos.length > 1 && (
              <>
                <button 
                  onClick={prevPhoto}
                  style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  &lsaquo;
                </button>
                <button 
                  onClick={nextPhoto}
                  style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  &rsaquo;
                </button>
                <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                  {photoIndex + 1}/{property.photos.length} 
                </span>
              </>
            )}
          </>
        ) : (
          <PropertyVisual color={property.color} />
        )}
        <span className={`status-pill ${property.status.toLowerCase().replace(' ', '-')}`}>{property.status}</span>
        <button className="card-menu" aria-label={`Options pour ${property.title}`}><MoreHorizontal size={18} /></button>
      </div>
      <div className="property-card-body">
        <div className="property-heading">
          <div><h3>{property.title}</h3><p>{property.address}</p></div>
          <span className="property-type">{property.type}</span>
        </div>
        <div className="property-meta">
          <span>{property.surface} m²</span>
          <span>{property.rooms} pièce{property.rooms !== '1' ? 's' : ''}</span>
          <span>
            {property.rent && !isNaN(Number(property.rent)) 
              ? Number(property.rent).toLocaleString('fr-FR') 
              : property.rent} Ar 
            {property.status !== 'Vendu' && property.status !== 'Réservé' && <small> / mois</small>}
          </span>
        </div>
        <div className="property-actions">
          <button className="outline-action" onClick={onEdit}><Pencil size={14} /> Modifier</button>
          <button className="delete-action" onClick={onDelete} aria-label={`Supprimer ${property.title}`}><Trash2 size={15} /></button>
        </div>
      </div>
    </article>
  )
}
