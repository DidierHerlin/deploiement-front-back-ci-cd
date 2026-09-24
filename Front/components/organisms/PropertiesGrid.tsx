'use client'
import { Building2 } from 'lucide-react'
import type { Property } from '../types'
import PropertyCard from "@/components/molecules/PropertyCard"

export default function PropertiesGrid({ properties, onEdit, onDelete }: { properties: Property[]; onEdit: (p: Property) => void; onDelete: (id: number) => void }) {
  if (properties.length === 0) {
    return (
      <div className="agent-empty">
        <Building2 size={30} />
        <h2>Aucun bien trouvé</h2>
        <p>Modifiez vos filtres ou ajoutez un nouveau bien au parc.</p>
      </div>
    )
  }

  return (
    <div className="agent-grid">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} onEdit={() => onEdit(property)} onDelete={() => onDelete(property.id)} />
      ))}
    </div>
  )
}
