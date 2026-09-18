'use client'

import { useState } from 'react'
import { Bien } from '@/lib/api'
import { Building2, MapPin, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

interface BienCardProps {
  bien: Bien
  onEdit: () => void
  onDelete: () => void
}

export function BienCard({ bien, onEdit, onDelete }: BienCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0)

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'DISPONIBLE': return 'bg-orange-100 text-orange-700'
      case 'LOUE': return 'bg-green-100 text-green-700'
      case 'VENDU': return 'bg-blue-100 text-blue-700'
      case 'RESERVE': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'TERRAIN': 'Terrain',
      'COMMERCE': 'Commerce',
      'BUREAU': 'Bureau'
    }
    return types[type] || type
  }

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex((prev) => (prev + 1) % bien.photos.length)
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex((prev) => (prev - 1 + bien.photos.length) % bien.photos.length)
  }

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow h-full group">
      <div className="h-48 bg-gray-100 relative overflow-hidden flex-shrink-0">
        {bien.photos && bien.photos.length > 0 ? (
          <>
            <img src={bien.photos[photoIndex]} alt={bien.titre} className="w-full h-full object-cover transition-opacity duration-300" />
            
            {bien.photos.length > 1 && (
              <>
                <button 
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
                
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                  {bien.photos.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all ${idx === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Building2 size={40} strokeWidth={1} />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(bien.statut)}`}>
            {bien.statut}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-gray-700 shadow-sm">
            {bien.mode_transaction === 'LOCATION' ? 'À LOUER' : 'À VENDRE'}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-semibold text-blue-600 mb-1">{getTypeLabel(bien.type)}</div>
        <h3 className="font-bold text-[#17202b] text-base mb-2 line-clamp-1" title={bien.titre}>{bien.titre}</h3>
        
        <div className="flex items-start gap-1.5 text-gray-500 text-xs mb-4 h-8">
          <MapPin size={14} className="flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{bien.adresse}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-600 mb-4 mt-auto">
          {bien.type !== 'TERRAIN' && (
            <div>
              <span className="block text-gray-400 text-[10px] uppercase font-semibold">Surface</span>
              <strong className="text-gray-800">{bien.surface} m²</strong>
            </div>
          )}
          {bien.type !== 'TERRAIN' && bien.nombre_pieces && (
            <div>
              <span className="block text-gray-400 text-[10px] uppercase font-semibold">Pièces</span>
              <strong className="text-gray-800">{bien.nombre_pieces}</strong>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between mt-auto">
          <div className="font-bold text-[#17202b] text-lg">
            {bien.mode_transaction === 'LOCATION' && bien.loyer_mensuel ? (
              <>{parseFloat(bien.loyer_mensuel).toLocaleString('fr-FR')} Ar <span className="text-xs font-normal text-gray-500">/ mois</span></>
            ) : bien.prix ? (
              <>{parseFloat(bien.prix).toLocaleString('fr-FR')} Ar</>
            ) : (
              <span className="text-sm text-gray-400">Prix sur demande</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={onEdit}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Modifier"
            >
              <Pencil size={15} />
            </button>
            <button 
              onClick={onDelete}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
