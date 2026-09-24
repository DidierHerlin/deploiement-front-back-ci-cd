'use client'

import { useState } from 'react'
import { Bien } from '@/lib/api'
import { BienCard } from "@/components/molecules/BienCard"
import { DeleteBienModal } from "@/components/organisms/bien_DeleteBienModal"

interface BienListProps {
  biens: Bien[]
  onEdit: (bien: Bien) => void
  onRefresh: () => void
}

export function BienList({ biens, onEdit, onRefresh }: BienListProps) {
  const [deletingBien, setDeletingBien] = useState<Bien | null>(null)

  if (biens.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 mb-2">Vous n'avez pas encore de biens.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
        {biens.map(bien => (
          <BienCard 
            key={bien.id} 
            bien={bien} 
            onEdit={() => onEdit(bien)}
            onDelete={() => setDeletingBien(bien)}
          />
        ))}
      </div>

      {deletingBien && (
        <DeleteBienModal 
          bien={deletingBien} 
          onClose={(refresh) => {
            setDeletingBien(null)
            if (refresh) onRefresh()
          }} 
        />
      )}
    </>
  )
}
