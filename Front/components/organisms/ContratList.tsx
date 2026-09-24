'use client'

import { Contrat } from '@/lib/api'
import { ContratCard } from "@/components/molecules/ContratCard"

interface ContratListProps {
  contrats: Contrat[]
}

export function ContratList({ contrats }: ContratListProps) {
  if (contrats.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 mb-2">Vous n'avez aucun contrat pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
      {contrats.map(contrat => (
        <ContratCard key={contrat.id} contrat={contrat} />
      ))}
    </div>
  )
}
