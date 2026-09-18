'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Paiement, fetchBlob } from '@/lib/api'
import { WalletCards, Calendar, User, FileText, Maximize2 } from 'lucide-react'
import { FactureModal } from './FactureModal'
import { AgentActions } from '@/app/agent/paiements/components/AgentActions'

interface PaiementCardProps {
  paiement: Paiement
  onUpdate?: (p: Paiement) => void
}

export function PaiementCard({ paiement: initialPaiement, onUpdate }: PaiementCardProps) {
  const [paiement, setPaiement] = useState<Paiement>(initialPaiement)
  const [showFacture, setShowFacture] = useState(false)
  
  useEffect(() => {
    setPaiement(initialPaiement)
  }, [initialPaiement])
  
  const handleUpdate = (p: Paiement) => {
    setPaiement(p)
    if (onUpdate) onUpdate(p)
  }
  const pathname = usePathname()
  const isAgent = pathname?.includes('/agent')
  const isProprietaire = pathname?.includes('/proprietaire') || !isAgent

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'PAYE': return 'bg-green-100 text-green-700'
      case 'EN_ATTENTE': return 'bg-orange-100 text-orange-700'
      case 'EN_RETARD': return 'bg-red-100 text-red-700'
      case 'ECHOUE': return 'bg-red-100 text-red-700'
      case 'REMBOURSE': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatStatut = (s: string) => {
    const map: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'PAYE': 'Payé',
      'EN_RETARD': 'En retard',
      'ECHOUE': 'Échoué',
      'REMBOURSE': 'Remboursé'
    }
    return map[s] || s
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '...'
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  // Calculate display amounts
  const baseAmount = parseFloat(paiement.montant_paye as string) || parseFloat(paiement.montant as string) || parseFloat(paiement.montant_attendu as string) || 0
  const isLocation = paiement.part_proprietaire != null && paiement.commission_agent != null
  let displayAmount = baseAmount
  
  if (isLocation) {
    if (isAgent) {
      displayAmount = Number(paiement.commission_agent)
    } else {
      displayAmount = Number(paiement.part_proprietaire)
    }
  }

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
            <WalletCards size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-green-600 mb-0.5">
              {paiement.message_mois || `Échéance n°${paiement.num_echeance}`}
            </div>
            <h3 className="font-bold text-[#17202b] text-base">Réf: {paiement.reference || `PMT-${paiement.id.toString().padStart(4, '0')}`}</h3>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(paiement.statut)}`}>
          {formatStatut(paiement.statut)}
        </span>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-2">
        <div className="flex items-start gap-2 text-sm text-gray-700 col-span-2">
          <FileText size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs text-gray-500">Bien concerné</span>
            <strong className="text-[#17202b]">{paiement.bien_titre || 'Bien inconnu'}</strong>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-700 col-span-2">
          <User size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs text-gray-500">Locataire / Acquéreur</span>
            <strong className="text-[#17202b]">{paiement.locataire_nom || 'Inconnu'}</strong>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-700">
          <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs text-gray-500">Paiement prévu</span>
            <strong className="text-[#17202b]">{formatDate(paiement.date_paiement_prevue)}</strong>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-700">
          <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs text-gray-500">Échéance</span>
            <strong className="text-[#17202b]">{formatDate(paiement.date_echeance)}</strong>
          </div>
        </div>

        {paiement.date_paiement && (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <Calendar size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs text-gray-500">Payé le</span>
              <strong className="text-[#17202b]">{formatDate(paiement.date_paiement)}</strong>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-100 p-4 bg-gray-50/50 mt-auto">
        {!isLocation ? (
          // Default display for non-LOCATION (e.g. ACHAT)
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Montant</div>
              <div className="font-bold text-[#17202b] text-lg">
                {displayAmount.toLocaleString('fr-FR')} Ar
              </div>
              {paiement.est_partiel && (
                <div className="text-xs text-orange-600 font-medium mt-0.5">
                  Reste à payer : {parseFloat(paiement.montant_restant || '0').toLocaleString('fr-FR')} Ar
                </div>
              )}
            </div>
          </div>
        ) : (
          // Modern Facture display for LOCATION
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md">
            {/* Facture Header */}
            <div className="bg-slate-800 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-400" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Facture de Gestion</h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">Ref: {paiement.reference || 'Auto'}</span>
                <button onClick={() => setShowFacture(true)} className="text-white hover:text-indigo-300 transition-colors" title="Agrandir la facture">
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Facture Body */}
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">{paiement.num_echeance === 1 ? 'Loyer + Dépôt de garantie' : 'Loyer mensuel brut'}</span>
                <span className="font-bold text-[#17202b]">{baseAmount.toLocaleString('fr-FR')} Ar</span>
              </div>
              
              <div className="border-t border-dashed border-gray-200 my-2"></div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    Part propriétaire 
                    <span className="text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded">90%</span>
                  </span>
                  <span className="font-medium text-gray-700">{Number(paiement.part_proprietaire).toLocaleString('fr-FR')} Ar</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    Frais d'agence 
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">10%</span>
                  </span>
                  <span className="font-medium text-gray-700">{Number(paiement.commission_agent).toLocaleString('fr-FR')} Ar</span>
                </div>
              </div>
            </div>

            {/* Facture Footer (Total) */}
            <div className="bg-indigo-50/50 border-t border-indigo-100 px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-indigo-900">
                {isAgent ? 'Votre commission nette :' : 'Votre revenu net :'}
              </span>
              <div className="text-right">
                <span className="text-lg font-bold text-indigo-700 block">
                  {displayAmount.toLocaleString('fr-FR')} Ar
                </span>
                {paiement.est_partiel && (
                  <span className="text-[10px] text-orange-600 font-medium block mt-0.5">
                    Reste : {parseFloat(paiement.montant_restant || '0').toLocaleString('fr-FR')} Ar
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isAgent && <AgentActions paiement={paiement} onStatusChange={handleUpdate} />}

      {showFacture && (
        <FactureModal 
          paiement={paiement} 
          isAgent={isAgent} 
          onClose={() => setShowFacture(false)} 
        />
      )}
    </div>
  )
}
