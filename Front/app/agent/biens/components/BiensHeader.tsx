'use client'
import { Plus } from 'lucide-react'

export default function BiensHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="agent-head">
      <div>
        <p className="eyebrow">GESTION DU PARC IMMOBILIER</p>
        <h1>Biens immobiliers</h1>
        <p className="subtitle">Retrouvez et gérez l&apos;ensemble de vos biens.</p>
      </div>
      <div className="agent-head-actions">
        <button className="agent-btn agent-btn-primary" onClick={onAdd}>
          <Plus size={16} /> Ajouter un bien
        </button>
      </div>
    </div>
  )
}
