'use client'

import { Contrat } from '@/lib/api'
import { FileText, Calendar, User, Building2, Eye } from 'lucide-react'

interface ContratCardProps {
  contrat: Contrat
}

export function ContratCard({ contrat }: ContratCardProps) {
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'ACTIF': return 'bg-green-100 text-green-700'
      case 'RESILIE': return 'bg-red-100 text-red-700'
      case 'TERMINE': return 'bg-gray-100 text-gray-700'
      case 'VENDU': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeLabel = (type: string | undefined) => {
    if (!type) return 'Bien'
    const types: Record<string, string> = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'TERRAIN': 'Terrain',
      'COMMERCE': 'Commerce',
      'BUREAU': 'Bureau'
    }
    return types[type] || type
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '...'
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-600 mb-0.5">CONTRAT DE {contrat.type_contrat}</div>
            <h3 className="font-bold text-[#17202b] text-base">Réf: CTR-{contrat.id.toString().padStart(4, '0')}</h3>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(contrat.statut)}`}>
          {contrat.statut}
        </span>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-2">
        <div className="flex items-start gap-2 text-sm text-gray-700 col-span-2">
          <Building2 size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs text-gray-500">{getTypeLabel(contrat.bien_type)}</span>
            <strong className="text-[#17202b]">{contrat.bien_titre || `Bien #${contrat.bien}`}</strong>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-700 col-span-2">
          <User size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs text-gray-500">Locataire / Acquéreur</span>
            <strong className="text-[#17202b]">
              {contrat.locataire_prenoms && contrat.locataire_nom 
                ? `${contrat.locataire_prenoms} ${contrat.locataire_nom}` 
                : `Utilisateur #${contrat.locataire}`}
            </strong>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-700">
          <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs text-gray-500">Début</span>
            <strong className="text-[#17202b]">{formatDate(contrat.date_debut)}</strong>
          </div>
        </div>

        {contrat.date_fin && (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs text-gray-500">Fin</span>
              <strong className="text-[#17202b]">{formatDate(contrat.date_fin)}</strong>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-gray-50/50 mt-auto">
        <div className="font-bold text-[#17202b] text-base">
          {contrat.type_contrat === 'LOCATION' && contrat.loyer ? (
            <>{parseFloat(contrat.loyer).toLocaleString('fr-FR')} Ar <span className="text-xs font-normal text-gray-500">/ mois</span></>
          ) : contrat.prix ? (
            <>{parseFloat(contrat.prix).toLocaleString('fr-FR')} Ar</>
          ) : (
            <span className="text-sm text-gray-400">Montant non défini</span>
          )}
        </div>
        
        {contrat.document_pdf && (
          <a 
            href={contrat.document_pdf} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Eye size={14} /> Voir PDF
          </a>
        )}
      </div>
    </div>
  )
}
