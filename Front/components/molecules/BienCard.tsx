'use client'

import { useState } from 'react'
import { Bien, resolveMediaUrl } from '@/lib/api'
import { Building2, MapPin, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface BienCardProps {
  bien: Bien
  onEdit: () => void
  onDelete: () => void
}

export function BienCard({ bien, onEdit, onDelete }: BienCardProps) {
  const { t } = useTranslation()
  const [photoIndex, setPhotoIndex] = useState(0)

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'DISPONIBLE': return 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
      case 'LOUE': return 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
      case 'VENDU': return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30'
      case 'RESERVE': return 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30'
      case 'EN_TRAVAUX': return 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30'
      default: return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'APPARTEMENT': return t("types.apartment", "Appartement")
      case 'MAISON': return t("types.house", "Maison")
      case 'TERRAIN': return t("types.land", "Terrain")
      case 'COMMERCE': return t("types.commercial", "Commerce")
      case 'BUREAU': return t("types.commercial", "Bureau")
      default: return type
    }
  }

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'DISPONIBLE': return t("dashboard.common.status_disponible", "Disponible")
      case 'LOUE': return t("dashboard.common.status_loue", "Loué")
      case 'VENDU': return t("dashboard.common.status_vendu", "Vendu")
      case 'RESERVE': return t("dashboard.common.status_reserve", "Réservé")
      case 'EN_TRAVAUX': return t("dashboard.common.status_en_travaux", "En travaux")
      default: return statut
    }
  }

  const photosList = Array.isArray(bien.photos) ? bien.photos : []
  const currentPhoto = photosList[photoIndex]
  const photoUrl = resolveMediaUrl(currentPhoto) || currentPhoto || ''

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (photosList.length > 0) {
      setPhotoIndex((prev) => (prev + 1) % photosList.length)
    }
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (photosList.length > 0) {
      setPhotoIndex((prev) => (prev - 1 + photosList.length) % photosList.length)
    }
  }

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all h-full group">
      <div className="h-48 bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex-shrink-0">
        {photoUrl ? (
          <>
            <img 
              src={photoUrl} 
              alt={bien.titre} 
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => {
                if (currentPhoto && e.currentTarget.src !== currentPhoto) {
                  e.currentTarget.src = currentPhoto
                }
              }}
            />
            
            {photosList.length > 1 && (
              <>
                <button 
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 text-gray-800 dark:text-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 text-gray-800 dark:text-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
                
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                  {photosList.map((_, idx) => (
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
          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
            <Building2 size={40} strokeWidth={1} />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor((bien?.statut || ''))}`}>
            {getStatusLabel(bien?.statut || '')}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700 backdrop-blur-xs">
            {(bien?.mode_transaction || '') === 'LOCATION' 
              ? t("card.for_rent", "À LOUER") 
              : t("card.for_sale", "À VENDRE")}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{getTypeLabel(bien?.type || '')}</span>
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2 line-clamp-1" title={bien.titre}>{bien.titre}</h3>
        
        <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-4 h-8">
          <MapPin size={14} className="flex-shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
          <span className="line-clamp-2">{bien.adresse}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-700 dark:text-slate-300 mb-4 mt-auto">
          {(bien?.type || '') !== 'TERRAIN' && (
            <div>
              <span className="block text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">{t("card.surface", "Surface")}</span>
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">{bien.surface} m²</strong>
            </div>
          )}
          {(bien?.type || '') !== 'TERRAIN' && bien.nombre_pieces && (
            <div>
              <span className="block text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">{t("card.rooms", "Pièces")}</span>
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">{bien.nombre_pieces}</strong>
            </div>
          )}
        </div>
        
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between mt-auto">
          <div className="font-bold text-slate-900 dark:text-white text-lg">
            {(bien?.mode_transaction || '') === 'LOCATION' && bien.loyer_mensuel ? (
              <>{parseFloat(bien.loyer_mensuel).toLocaleString('fr-FR')} Ar <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t("card.per_month", "/ mois")}</span></>
            ) : bien.prix ? (
              <>{parseFloat(bien.prix).toLocaleString('fr-FR')} Ar</>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500 font-normal">{t("card.price_on_request", "Prix sur demande")}</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={onEdit}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t("forms.edit", "Modifier")}
            >
              <Pencil size={15} />
            </button>
            <button 
              onClick={onDelete}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t("forms.delete", "Supprimer")}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
