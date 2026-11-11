'use client'

import React, { useState } from 'react'
import { Bien, Proprietaire, createBien, updateBien, resolveMediaUrl } from '@/lib/api'
import { X, Save, AlertCircle, Building2, Trash2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export type BienFormProps = {
  // Mode Propriétaire (auto-géré)
  bien?: Bien
  onClose: (refresh?: boolean) => void

  // Mode Admin (contrôlé)
  editingBien?: Bien | null
  newBien?: Partial<Bien>
  setNewBien?: (bien: Partial<Bien>) => void
  proprietaires?: Proprietaire[]
  onSubmit?: (e: React.FormEvent) => void
}

export function BienForm(props: BienFormProps) {
  const { t } = useTranslation()

  // ─────────────────────────────────────────────────────────────
  // 1. CAS CONTRÔLÉ (ADMIN) : onSubmit + newBien + setNewBien
  // ─────────────────────────────────────────────────────────────
  if (props.onSubmit && props.newBien && props.setNewBien) {
    const { editingBien, newBien, setNewBien, proprietaires = [], onClose, onSubmit } = props
    const isTerrain = newBien.type === 'TERRAIN'
    const isVente = newBien.mode_transaction === 'VENTE'

    const handleProprietaireChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pId = parseInt(e.target.value)
      setNewBien({ ...newBien, proprietaire: pId as any })
    }

    const handleRemovePhoto = (index: number) => {
      const newPhotos = [...(newBien.photos || [])]
      newPhotos.splice(index, 1)
      setNewBien({ ...newBien, photos: newPhotos })
    }

    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        role="presentation"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <section 
          className="w-full max-w-[560px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-title"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <div>
                <h2 id="form-title" className="text-base font-bold text-slate-900 dark:text-white m-0">
                  {editingBien ? t("admin.biens.edit_property", "Modifier le bien") : t("admin.biens.new_property", "Nouveau bien")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                  {t("admin.biens.form_subtitle", "Remplissez les détails du bien immobilier ci-dessous.")}
                </p>
              </div>
            </div>
            <button 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              onClick={onClose}
              aria-label={t("forms.close", "Fermer")}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("forms.property_title", "Titre du bien *")}
                </label>
                <input 
                  required 
                  type="text" 
                  placeholder={t("forms.property_title_placeholder", "Ex: Bel appartement centre-ville")} 
                  value={newBien.titre || ''} 
                  onChange={e => setNewBien({ ...newBien, titre: e.target.value })} 
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("forms.property_type", "Type de bien *")}
                  </label>
                  <select 
                    value={newBien.type || 'APPARTEMENT'} 
                    onChange={e => setNewBien({ ...newBien, type: e.target.value as any })}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="APPARTEMENT">{t("types.apartment", "Appartement")}</option>
                    <option value="MAISON">{t("types.house", "Maison")}</option>
                    <option value="TERRAIN">{t("types.land", "Terrain")}</option>
                    <option value="COMMERCE">{t("types.commercial", "Commerce")}</option>
                    <option value="BUREAU">{t("types.commercial", "Bureau")}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("forms.transaction_type", "Transaction *")}
                  </label>
                  <select 
                    value={newBien.mode_transaction || 'LOCATION'} 
                    onChange={e => setNewBien({ ...newBien, mode_transaction: e.target.value as any })}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="LOCATION">{t("types.location", "Location")}</option>
                    <option value="VENTE">{t("types.sale", "Vente")}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("forms.address", "Adresse complète *")}
                </label>
                <input 
                  required 
                  type="text" 
                  placeholder={t("forms.address_placeholder", "Ex: 12 rue de la Paix, 75000 Paris")} 
                  value={newBien.adresse || ''} 
                  onChange={e => setNewBien({ ...newBien, adresse: e.target.value })} 
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("forms.surface", "Surface (m²) *")}
                  </label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    step="0.01" 
                    value={newBien.surface || ''} 
                    onChange={e => setNewBien({ ...newBien, surface: parseFloat(e.target.value) || 0 })} 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {!isTerrain && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("forms.rooms", "Nombre de pièces *")}
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      value={newBien.nombre_pieces || ''} 
                      onChange={e => setNewBien({ ...newBien, nombre_pieces: parseInt(e.target.value) || 0 })} 
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isVente ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("forms.monthly_rent", "Loyer mensuel (Ar) *")}
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={newBien.loyer_mensuel || ''} 
                      onChange={e => setNewBien({ ...newBien, loyer_mensuel: e.target.value })} 
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("forms.sale_price", "Prix de vente (Ar) *")}
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={newBien.prix || ''} 
                      onChange={e => setNewBien({ ...newBien, prix: e.target.value })} 
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("forms.status", "Statut *")}
                  </label>
                  <select 
                    value={newBien.statut || 'DISPONIBLE'} 
                    onChange={e => setNewBien({ ...newBien, statut: e.target.value as any })}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="DISPONIBLE">{t("dashboard.common.status_disponible", "Disponible")}</option>
                    <option value="LOUE">{t("dashboard.common.status_loue", "Loué")}</option>
                    <option value="VENDU">{t("dashboard.common.status_vendu", "Vendu")}</option>
                    <option value="RESERVE">{t("dashboard.common.status_reserve", "Réservé")}</option>
                    <option value="EN_TRAVAUX">{t("dashboard.common.status_en_travaux", "En travaux")}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("forms.owner", "Propriétaire *")}
                </label>
                <select 
                  required 
                  value={typeof newBien.proprietaire === 'object' ? newBien.proprietaire?.id : (newBien.proprietaire || '')} 
                  onChange={handleProprietaireChange}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">{t("forms.select_owner", "-- Sélectionner un propriétaire --")}</option>
                  {proprietaires.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.user?.nom} {p.user?.prenoms} ({p.user?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("forms.photos", "Photos")}
                </label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;

                    const base64Promises = Array.from(files).map(file => {
                      return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = error => reject(error);
                        reader.readAsDataURL(file);
                      });
                    });

                    try {
                      const base64Images = await Promise.all(base64Promises);
                      setNewBien({ ...newBien, photos: [...(newBien.photos || []), ...base64Images] });
                    } catch (error) {
                      console.error("Erreur lors de la lecture des images", error);
                      alert(t("forms.error", "Erreur lors de la sélection des images."));
                    }
                    e.target.value = '';
                  }}
                  className="block w-full text-xs text-slate-700 dark:text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-slate-800 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 bg-white dark:bg-slate-800"
                />
              </div>

              {newBien.photos && newBien.photos.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mt-2.5">
                  {newBien.photos.map((dataUrl, idx) => (
                    <div key={idx} className="relative w-20 h-20">
                      <img 
                        src={resolveMediaUrl(dataUrl) || dataUrl} 
                        alt={t("forms.preview", "Aperçu")} 
                        className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700" 
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white border-0 rounded-full p-1 cursor-pointer transition-colors"
                        title={t("forms.delete", "Supprimer")}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 shrink-0 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                type="button" 
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
                onClick={onClose}
              >
                {t("forms.cancel", "Annuler")}
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                {editingBien ? t("forms.save", 'Enregistrer les modifications') : t("admin.biens.add_property", 'Ajouter le bien')}
              </button>
            </div>
          </form>
        </section>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CAS AUTO-GÉRÉ (PROPRIÉTAIRE) : bien + onClose
  // ─────────────────────────────────────────────────────────────
  const { bien, onClose } = props
  const isEditing = !!bien
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Bien>>({
    titre: bien?.titre || '',
    type: bien?.type || 'APPARTEMENT',
    mode_transaction: (bien?.mode_transaction as any) || 'LOCATION',
    adresse: bien?.adresse || '',
    surface: bien?.surface || 0,
    nombre_pieces: bien?.nombre_pieces || 1,
    loyer_mensuel: bien?.loyer_mensuel || '',
    prix: bien?.prix || '',
    statut: (bien?.statut as any) || 'DISPONIBLE',
    photos: bien?.photos || [],
  })

  const isLocation = formData.mode_transaction === 'LOCATION'
  const isTerrain = formData.type === 'TERRAIN'
  const isReadOnlyStatus = isEditing && (bien?.statut === 'LOUE' || bien?.statut === 'VENDU')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const promises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = error => reject(error)
        reader.readAsDataURL(file)
      })
    })

    Promise.all(promises).then(base64Files => {
      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...base64Files]
      }))
    }).catch(err => {
      console.error("Erreur lors de la lecture des images", err)
    })
  }

  const removePhoto = (index: number) => {
    setFormData(prev => {
      const newPhotos = [...(prev.photos || [])]
      newPhotos.splice(index, 1)
      return { ...prev, photos: newPhotos }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload: Partial<Bien> = { ...formData }
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

      if (isEditing && bien?.id) {
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

  return (
    <div className="modal-backdrop bg-black/60 backdrop-blur-xs">
      <div className="modal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-xl">
        <button className="modal-close text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" onClick={() => onClose()}><X size={20} /></button>
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
          {isEditing ? t("proprietaire_pages.biens.edit_title", "Modifier le bien") : t("proprietaire_pages.biens.add_title", "Ajouter un nouveau bien")}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {isReadOnlyStatus && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{t("proprietaire_pages.biens.readonly_notice", `Ce bien est actuellement ${bien?.statut?.toLowerCase()}, certaines informations ne peuvent plus être modifiées.`)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.property_title", "Titre du bien *")}</label>
            <input required type="text" name="titre" value={formData.titre || ''} onChange={handleChange} placeholder={t("forms.property_title_placeholder", "Ex: Bel appartement centre-ville")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.property_type", "Type de bien *")}</label>
              <select name="type" value={formData.type} onChange={handleChange} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs outline-none focus:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="APPARTEMENT">{t("types.apartment", "Appartement")}</option>
                <option value="MAISON">{t("types.house", "Maison")}</option>
                <option value="TERRAIN">{t("types.land", "Terrain")}</option>
                <option value="COMMERCE">{t("types.commercial", "Commerce")}</option>
                <option value="BUREAU">{t("types.commercial", "Bureau")}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.transaction_type", "Transaction *")}</label>
              <select name="mode_transaction" value={formData.mode_transaction} onChange={handleChange} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs outline-none focus:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" disabled={isReadOnlyStatus}>
                <option value="LOCATION">{t("types.location", "Location")}</option>
                <option value="VENTE">{t("types.sale", "Vente")}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.address", "Adresse *")}</label>
            <input required type="text" name="adresse" value={formData.adresse || ''} onChange={handleChange} placeholder={t("forms.address_placeholder", "Ex: 12 rue de la Paix, 75000 Paris")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.surface", "Surface (m²) *")}</label>
              <input required type="number" min="1" step="0.01" name="surface" value={formData.surface || ''} onChange={handleChange} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
            </div>
            {!isTerrain && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.rooms", "Nombre de pièces *")}</label>
                <input required type="number" min="1" name="nombre_pieces" value={formData.nombre_pieces || ''} onChange={handleChange} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isLocation ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.monthly_rent", "Loyer mensuel (Ar) *")}</label>
                <input required type="number" min="0" step="0.01" name="loyer_mensuel" value={formData.loyer_mensuel || ''} onChange={handleChange} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.sale_price", "Prix de vente (Ar) *")}</label>
                <input required type="number" min="0" step="0.01" name="prix" value={formData.prix || ''} onChange={handleChange} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs outline-none focus:border-blue-600" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.status", "Statut *")}</label>
              <select name="statut" value={formData.statut} onChange={handleChange} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs outline-none focus:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" disabled={isReadOnlyStatus}>
                <option value="DISPONIBLE">{t("dashboard.common.status_disponible", "Disponible")}</option>
                <option value="LOUE">{t("dashboard.common.status_loue", "Loué")}</option>
                <option value="VENDU">{t("dashboard.common.status_vendu", "Vendu")}</option>
                <option value="EN_TRAVAUX">{t("dashboard.common.status_en_travaux", "En travaux")}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("forms.photos", "Photos")}</label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-700 dark:text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-slate-800 dark:file:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 bg-white dark:bg-slate-800"
            />
          </div>

          {formData.photos && formData.photos.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                  <img 
                    src={resolveMediaUrl(photo) || photo} 
                    alt="Bien preview" 
                    className="w-full h-full object-cover" 
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
export default BienForm
