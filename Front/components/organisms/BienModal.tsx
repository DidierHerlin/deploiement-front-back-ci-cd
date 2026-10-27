import { X, Building2, Pencil } from 'lucide-react'
import { Bien, resolveMediaUrl } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { getProprietaireName } from '@/components/organisms/BienTableRow'

type BienModalProps = {
  bien: Bien
  onClose: () => void
  onEdit: () => void
}

export function BienModal({ bien, onClose, onEdit }: BienModalProps) {
  const { t } = useTranslation()

  const getPrixLoyer = () => {
    if (bien.mode_transaction === 'VENTE') {
      return bien.prix ? `${Number(bien.prix).toLocaleString('fr-FR')} Ar` : 'N/A'
    } else {
      return bien.loyer_mensuel ? `${Number(bien.loyer_mensuel).toLocaleString('fr-FR')} Ar ${t("card.per_month", "/ mois")}` : 'N/A'
    }
  }

  const formatType = (type: string) => {
    switch(type) {
      case 'APPARTEMENT': return t("types.apartment", 'Appartement')
      case 'MAISON': return t("types.house", 'Maison')
      case 'LOCAL_COMMERCIAL': return t("types.commercial", 'Local commercial')
      case 'TERRAIN': return t("types.land", 'Terrain')
      default: return type
    }
  }

  const formatStatut = (statut: string) => {
    switch(statut) {
      case 'DISPONIBLE': return t("dashboard.common.status_disponible", 'Disponible')
      case 'RESERVE': return t("dashboard.common.status_reserve", 'Réservé')
      case 'LOUE': return t("dashboard.common.status_loue", 'Loué')
      case 'VENDU': return t("dashboard.common.status_vendu", 'Vendu')
      case 'EN_TRAVAUX': return t("dashboard.common.status_en_travaux", 'En travaux')
      default: return statut
    }
  }

  const ownerName = getProprietaireName(bien)

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section 
        className="w-full max-w-[850px] max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative flex flex-col" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="detail-title"
      >
        <button 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer" 
          onClick={onClose} 
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>
        
        <div className="shrink-0 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/20">
            <Building2 size={20} />
          </div>
          <h2 id="detail-title" className="text-xl font-bold text-slate-900 dark:text-white m-0">
            {t("admin.biens.details_title", "Détails du bien")}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <small className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("forms.property_title", "Titre")}</small>
              <p className="font-semibold text-slate-900 dark:text-slate-100 m-0 text-sm">{bien.titre}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <small className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("admin.biens.col_owner", "Propriétaire")}</small>
              <p className="font-semibold text-slate-900 dark:text-slate-100 m-0 text-sm">
                {ownerName || <span className="italic text-slate-400 dark:text-slate-500 text-xs font-normal">{t("admin.biens.unassigned", "Non affecté")}</span>}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <small className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("admin.biens.type_operation", "Type / Opération")}</small>
              <p className="font-semibold text-slate-900 dark:text-slate-100 m-0 text-sm">{formatType(bien.type)} • {bien.mode_transaction === 'VENTE' ? t("card.for_sale", 'Vente') : t("card.for_rent", 'Location')}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <small className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("forms.status", "Statut")}</small>
              <p className="font-semibold text-slate-900 dark:text-slate-100 m-0 text-sm">{formatStatut(bien.statut)}</p>
            </div>
            <div className="sm:col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <small className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("forms.address", "Adresse")}</small>
              <p className="font-semibold text-slate-900 dark:text-slate-100 m-0 text-sm">{bien.adresse}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <small className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("forms.surface", "Surface")}</small>
              <p className="font-semibold text-slate-900 dark:text-slate-100 m-0 text-sm">{bien.surface} m²</p>
            </div>
            {bien.type !== 'TERRAIN' && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <small className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("forms.rooms_count", "Nombre de pièces")}</small>
                <p className="font-semibold text-slate-900 dark:text-slate-100 m-0 text-sm">{bien.nombre_pieces}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <small className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{bien.mode_transaction === 'VENTE' ? t("card.sale_price", 'Prix') : t("card.monthly_rent", 'Loyer')}</small>
              <p className="font-semibold text-slate-900 dark:text-slate-100 m-0 text-sm">{getPrixLoyer()}</p>
            </div>
          </div>

          {bien.photos && bien.photos.length > 0 && (
            <div className="mt-5">
              <small className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2.5 block">{t("forms.property_photos", "Photos")} ({bien.photos.length})</small>
              <div className="flex gap-2.5 overflow-x-auto pb-2.5">
                {bien.photos.map((photoUrl, idx) => {
                  const resolvedUrl = resolveMediaUrl(photoUrl) || photoUrl
                  return (
                    <a key={idx} href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="block shrink-0">
                      <img 
                        src={resolvedUrl} 
                        alt={`Photo ${idx + 1} de ${bien.titre}`} 
                        className="w-[120px] h-[80px] object-cover rounded-lg border border-slate-200 dark:border-slate-700" 
                        onError={(e) => {
                          if (photoUrl && e.currentTarget.src !== photoUrl) {
                            e.currentTarget.src = photoUrl
                          }
                        }}
                      />
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 shrink-0 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            type="button" 
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
            onClick={onClose}
          >
            {t("forms.close", "Fermer")}
          </button>
          <button 
            type="button" 
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer" 
            onClick={onEdit}
          >
            <Pencil size={15} /> {t("forms.edit", "Modifier")}
          </button>
        </div>
      </section>
    </div>
  )
}
