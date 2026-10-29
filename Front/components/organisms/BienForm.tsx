'use client'

import { useState, useEffect } from 'react'
import { Bien, createBien, updateBien, resolveMediaUrl } from '@/lib/api'
import { X, Save, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface BienFormProps {
  bien?: Bien
  onClose: (refresh?: boolean) => void
}

export function BienForm({ bien, onClose }: BienFormProps) {
  const { t } = useTranslation()
  const isEditing = !!bien
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Bien>>({
    titre: bien?.titre || '',
    type: bien?.type || 'APPARTEMENT',
    mode_transaction: bien?.mode_transaction || 'LOCATION',
    adresse: bien?.adresse || '',
    surface: bien?.surface || 0,
    nombre_pieces: bien?.nombre_pieces || 1,
    loyer_mensuel: bien?.loyer_mensuel || '',
    prix: bien?.prix || '',
    statut: bien?.statut || 'DISPONIBLE',
    photos: bien?.photos || [],
  })

  // Ensure loyer_mensuel / prix logic based on mode_transaction
  const isLocation = formData.mode_transaction === 'LOCATION'
  const isTerrain = formData.type === 'TERRAIN'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Convert files to base64
    const promises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(base64Files => {
      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...base64Files]
      }));
    }).catch(err => {
      console.error("Erreur lors de la lecture des images", err);
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => {
      const newPhotos = [...(prev.photos || [])];
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload: Partial<Bien> = { ...formData }
      
      // Conversion des types et nettoyage
      payload.surface = Number(payload.surface)
      
      if (isTerrain) {
        delete payload.nombre_pieces
      } else {
        payload.nombre_pieces = Number(payload.nombre_pieces)
      }

      if (isLocation) {
        payload.loyer_mensuel = String(payload.loyer_mensuel)
        delete payload.prix
      } else {
        payload.prix = String(payload.prix)
        delete payload.loyer_mensuel
      }

      if (isEditing && bien.id) {
        await updateBien(bien.id, payload)
      } else {
        await createBien(payload)
      }
      onClose(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || t("forms.error", 'Une erreur est survenue lors de l\'enregistrement.'))
    } finally {
      setLoading(false)
    }
  }

  const isReadOnlyStatus = isEditing && (bien.statut === 'LOUE' || bien.statut === 'VENDU')

  return (
    <div className="modal-backdrop bg-black/60 backdrop-blur-xs">
      <div className="modal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl" style={{ width: 'min(500px, 100%)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" onClick={() => onClose()}><X size={20} /></button>
        <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-1">{isEditing ? t("admin.biens.edit_title", 'Modifier le bien') : t("admin.biens.create_title", 'Ajouter un bien')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">{isEditing ? t("admin.biens.edit_sub", 'Mettez à jour les informations de votre bien.') : t("proprietaire_pages.biens.form_sub", 'Renseignez les détails pour ajouter un nouveau bien à votre patrimoine.')}</p>
        
        {isReadOnlyStatus && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs rounded-lg flex gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            {t("proprietaire_pages.biens.readonly_notice", `Ce bien est actuellement ${bien.statut.toLowerCase()}, certaines informations ne peuvent plus être modifiées.`)}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
            {t("forms.property_title", "Titre du bien *")}
            <input required type="text" name="titre" value={formData.titre || ''} onChange={handleChange} placeholder={t("forms.property_title_placeholder", "Ex: Bel appartement centre-ville")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {t("forms.property_type", "Type de bien *")}
              <select name="type" value={formData.type} onChange={handleChange} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs outline-none focus:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="APPARTEMENT">{t("types.apartment", "Appartement")}</option>
                <option value="MAISON">{t("types.house", "Maison")}</option>
                <option value="TERRAIN">{t("types.land", "Terrain")}</option>
                <option value="COMMERCE">{t("types.commercial", "Commerce")}</option>
                <option value="BUREAU">{t("types.commercial", "Bureau")}</option>
              </select>
            </label>
            
            <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {t("forms.transaction_type", "Transaction *")}
              <select name="mode_transaction" value={formData.mode_transaction} onChange={handleChange} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs outline-none focus:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" disabled={isReadOnlyStatus}>
                <option value="LOCATION">{t("card.for_rent", "À louer")}</option>
                <option value="VENTE">{t("card.for_sale", "À vendre")}</option>
              </select>
            </label>
          </div>

          <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
            {t("forms.address", "Adresse complète *")}
            <input required type="text" name="adresse" value={formData.adresse || ''} onChange={handleChange} placeholder={t("forms.address_placeholder", "Ex: 12 rue de la Paix, 75000 Paris")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {t("forms.surface", "Surface (m²) *")}
              <input required type="number" min="1" step="0.01" name="surface" value={formData.surface || ''} onChange={handleChange} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
            </label>

            {!isTerrain && (
              <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                {t("forms.rooms_count", "Nombre de pièces *")}
                <input required type="number" min="1" name="nombre_pieces" value={formData.nombre_pieces || ''} onChange={handleChange} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isLocation ? (
              <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                {t("forms.monthly_rent", "Loyer mensuel (Ar) *")}
                <input required type="number" min="0" step="0.01" name="loyer_mensuel" value={formData.loyer_mensuel || ''} onChange={handleChange} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
              </label>
            ) : (
              <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                {t("forms.sale_price", "Prix de vente (Ar) *")}
                <input required type="number" min="0" step="0.01" name="prix" value={formData.prix || ''} onChange={handleChange} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
              </label>
            )}

            <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {t("forms.status", "Statut")}
              <select name="statut" value={formData.statut} onChange={handleChange} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs outline-none focus:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" disabled={isReadOnlyStatus}>
                <option value="DISPONIBLE">{t("dashboard.common.status_disponible", "Disponible")}</option>
                <option value="EN_TRAVAUX">{t("dashboard.common.status_en_travaux", "En travaux")}</option>
                {isReadOnlyStatus && (
                  <>
                    <option value="LOUE">{t("dashboard.common.status_loue", "Loué")}</option>
                    <option value="VENDU">{t("dashboard.common.status_vendu", "Vendu")}</option>
                  </>
                )}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{t("forms.property_photos", "Photos du bien")}</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleFileChange} 
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:border-blue-600 w-full bg-white dark:bg-slate-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer text-slate-500 dark:text-slate-400"
            />
          </div>

          {formData.photos && formData.photos.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 mt-1">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group">
                  <img 
                    src={resolveMediaUrl(photo) || photo} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      if (photo && e.currentTarget.src !== photo) {
                        e.currentTarget.src = photo
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title={t("forms.delete", "Supprimer la photo")}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={() => onClose()} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              {t("forms.cancel", "Annuler")}
            </button>
            <button type="submit" disabled={loading} className="primary-button cursor-pointer">
              <Save size={14} /> {loading ? t("forms.saving", 'Enregistrement...') : t("forms.save", 'Enregistrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
