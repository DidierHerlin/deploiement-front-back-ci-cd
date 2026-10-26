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
    <div className="modal-backdrop">
      <div className="modal" style={{ width: 'min(500px, 100%)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={() => onClose()}><X size={20} /></button>
        <h2>{isEditing ? t("admin.biens.edit_title", 'Modifier le bien') : t("admin.biens.create_title", 'Ajouter un bien')}</h2>
        <p>{isEditing ? t("admin.biens.edit_sub", 'Mettez à jour les informations de votre bien.') : t("proprietaire_pages.biens.form_sub", 'Renseignez les détails pour ajouter un nouveau bien à votre patrimoine.')}</p>
        
        {isReadOnlyStatus && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            {t("proprietaire_pages.biens.readonly_notice", `Ce bien est actuellement ${bien.statut.toLowerCase()}, certaines informations ne peuvent plus être modifiées.`)}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label>
            {t("forms.property_title", "Titre du bien *")}
            <input required type="text" name="titre" value={formData.titre || ''} onChange={handleChange} placeholder={t("forms.property_title_placeholder", "Ex: Bel appartement centre-ville")} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label>
              {t("forms.property_type", "Type de bien *")}
              <select name="type" value={formData.type} onChange={handleChange} className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-600">
                <option value="APPARTEMENT">{t("types.apartment", "Appartement")}</option>
                <option value="MAISON">{t("types.house", "Maison")}</option>
                <option value="TERRAIN">{t("types.land", "Terrain")}</option>
                <option value="COMMERCE">{t("types.commercial", "Commerce")}</option>
                <option value="BUREAU">{t("types.commercial", "Bureau")}</option>
              </select>
            </label>
            
            <label>
              {t("forms.transaction_type", "Transaction *")}
              <select name="mode_transaction" value={formData.mode_transaction} onChange={handleChange} className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-600" disabled={isReadOnlyStatus}>
                <option value="LOCATION">{t("card.for_rent", "À louer")}</option>
                <option value="VENTE">{t("card.for_sale", "À vendre")}</option>
              </select>
            </label>
          </div>

          <label>
            {t("forms.address", "Adresse complète *")}
            <input required type="text" name="adresse" value={formData.adresse || ''} onChange={handleChange} placeholder={t("forms.address_placeholder", "Ex: 12 rue de la Paix, 75000 Paris")} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label>
              {t("forms.surface", "Surface (m²) *")}
              <input required type="number" min="1" step="0.01" name="surface" value={formData.surface || ''} onChange={handleChange} />
            </label>

            {!isTerrain && (
              <label>
                {t("forms.rooms_count", "Nombre de pièces *")}
                <input required type="number" min="1" name="nombre_pieces" value={formData.nombre_pieces || ''} onChange={handleChange} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isLocation ? (
              <label>
                {t("forms.monthly_rent", "Loyer mensuel (Ar) *")}
                <input required type="number" min="0" step="0.01" name="loyer_mensuel" value={formData.loyer_mensuel || ''} onChange={handleChange} />
              </label>
            ) : (
              <label>
                {t("forms.sale_price", "Prix de vente (Ar) *")}
                <input required type="number" min="0" step="0.01" name="prix" value={formData.prix || ''} onChange={handleChange} />
              </label>
            )}

            <label>
              {t("forms.status", "Statut")}
              <select name="statut" value={formData.statut} onChange={handleChange} className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-600" disabled={isReadOnlyStatus}>
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
            <label>{t("forms.property_photos", "Photos du bien")}</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleFileChange} 
              className="border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-600 w-full bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-gray-500"
            />
          </div>

          {formData.photos && formData.photos.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 mt-1">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
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
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t("forms.delete", "Supprimer la photo")}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={() => onClose()} className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              {t("forms.cancel", "Annuler")}
            </button>
            <button type="submit" disabled={loading} className="primary-button">
              <Save size={14} /> {loading ? t("forms.saving", 'Enregistrement...') : t("forms.save", 'Enregistrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
