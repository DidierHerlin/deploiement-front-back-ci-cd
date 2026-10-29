'use client'

import { useState } from 'react'
import { Bien } from '@/lib/api'
import { BienCard } from "@/components/molecules/BienCard"
import { DeleteBienModal } from "@/components/organisms/DeleteBienModal"
import { useTranslation } from '@/lib/i18n'

interface BienListProps {
  biens: Bien[]
  onEdit: (bien: Bien) => void
  onRefresh: () => void
}

export function BienList({ biens, onEdit, onRefresh }: BienListProps) {
  const { t } = useTranslation()
  const [deletingBien, setDeletingBien] = useState<Bien | null>(null)

  if (biens.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        <p className="text-slate-500 dark:text-slate-400 mb-2">{t("proprietaire_pages.biens.empty", "Vous n'avez pas encore de biens.")}</p>
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
