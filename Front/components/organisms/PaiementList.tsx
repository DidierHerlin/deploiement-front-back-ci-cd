'use client'

import { Paiement } from '@/lib/api'
import { PaiementCard } from "@/components/molecules/PaiementCard"

interface PaiementListProps {
  paiements: Paiement[]
}

export function PaiementList({ paiements }: PaiementListProps) {
  if (paiements.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 mb-2">Vous n'avez aucun paiement enregistré pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
      {paiements.map(paiement => (
        <PaiementCard key={paiement.id} paiement={paiement} />
      ))}
    </div>
  )
}
