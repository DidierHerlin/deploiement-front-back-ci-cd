'use client'
import { Building2 } from 'lucide-react'
import type { Property } from '../types'
import PropertyCard from './PropertyCard'

export default function PropertiesGrid({ properties, onEdit, onDelete }: { properties: Property[]; onEdit: (p: Property) => void; onDelete: (id: number) => void }) {
  if (properties.length === 0) {
    return (
      <div className="empty-properties">
        <Building2 size={28} />
        <h2>Aucun bien trouvé</h2>
        <p>Modifiez vos filtres ou ajoutez un nouveau bien.</p>
      </div>
    )
  }

  return (
    <section className="properties-grid">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} onEdit={() => onEdit(property)} onDelete={() => onDelete(property.id)} />
      ))}
    </section>
  )
}
