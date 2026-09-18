'use client'
import { Plus } from 'lucide-react'

export default function BiensHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="properties-heading">
      <div>
        <p className="eyebrow">GESTION DU PARC IMMOBILIER</p>
        <h1>Biens immobiliers</h1>
        <p className="subtitle">Retrouvez et gérez l&apos;ensemble de vos biens.</p>
      </div>
      <button className="primary-action" onClick={onAdd}>
        <Plus size={17} /> Ajouter un bien
      </button>
    </section>
  )
}
