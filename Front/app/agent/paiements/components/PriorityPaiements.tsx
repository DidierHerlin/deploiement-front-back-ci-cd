'use client'

import { useState } from 'react'
import { Paiement } from '@/lib/api'
import { AlertCircle, Clock, CheckCircle2, User } from 'lucide-react'
import { AgentActions } from './AgentActions'
import { FactureModal } from '@/proprietaire/components/paiements/FactureModal'
import { Pagination } from '@/components/ui/pagination'

interface PriorityPaiementsProps {
  paiements: Paiement[]
  onUpdate: (p: Paiement) => void
}

export function PriorityPaiements({ paiements, onUpdate }: PriorityPaiementsProps) {
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null)
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const now = new Date()
  now.setHours(0,0,0,0)

  const prioritaires = paiements.filter(p => {
    if (p.statut !== 'EN_ATTENTE') return false
    if (!p.date_echeance) return false
    const due = new Date(p.date_echeance)
    due.setHours(0,0,0,0)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 // Proche (7 jours) ou dépassée
  }).sort((a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime())

  if (prioritaires.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
        <CheckCircle2 size={32} className="mx-auto text-green-500 mb-3" />
        <h3 className="font-bold text-gray-800">Aucun paiement prioritaire</h3>
        <p className="text-gray-500 text-sm mt-1">Tous les paiements urgents ont été traités.</p>
      </div>
    )
  }

  const totalPages = Math.ceil(prioritaires.length / ITEMS_PER_PAGE);
  const paginatedData = prioritaires.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getDaysInfo = (dateStr: string) => {
    const due = new Date(dateStr)
    due.setHours(0,0,0,0)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return <span className="text-red-600 font-bold">Dépassé de {Math.abs(diffDays)} j</span>
    } else if (diffDays === 0) {
      return <span className="text-orange-600 font-bold">Aujourd'hui</span>
    } else {
      return <span className="text-orange-500 font-medium">Dans {diffDays} j</span>
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden mb-8">
        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-red-600" />
          <h2 className="font-bold text-red-900 m-0">Paiements Prioritaires à Traiter</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 tracking-wider">
                <th className="p-4 font-semibold">Bien & Locataire</th>
                <th className="p-4 font-semibold">Échéance & Délai</th>
                <th className="p-4 font-semibold text-right">Loyer Total</th>
                <th className="p-4 font-semibold text-right text-indigo-700">Commission (10%)</th>
                <th className="p-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {paginatedData.map(p => {
                const baseAmount = parseFloat(p.montant_paye as string) || parseFloat(p.montant as string) || parseFloat(p.montant_attendu as string) || 0
                
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{p.bien_titre || 'Bien inconnu'}</div>
                      <div className="text-gray-500 flex items-center gap-1 mt-0.5">
                        <User size={12} /> {p.locataire_nom || 'Non spécifié'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.message_mois}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{new Date(p.date_echeance).toLocaleDateString('fr-FR')}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs">
                        <Clock size={12} /> {getDaysInfo(p.date_echeance)}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-800">
                      {baseAmount.toLocaleString('fr-FR')} Ar
                    </td>
                    <td className="p-4 text-right font-black text-indigo-600">
                      {Number(p.commission_agent || 0).toLocaleString('fr-FR')} Ar
                    </td>
                    <td className="p-4">
                      <div className="min-w-[200px]">
                        <AgentActions 
                          paiement={p} 
                          onStatusChange={(updated) => {
                            onUpdate(updated)
                          }} 
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {selectedPaiement && (
          <FactureModal
            paiement={selectedPaiement}
            isAgent={true}
            onClose={() => setSelectedPaiement(null)}
          />
        )}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
