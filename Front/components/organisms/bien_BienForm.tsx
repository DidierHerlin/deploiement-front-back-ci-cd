import { useState } from 'react'
import { X, Building2, Trash2 } from 'lucide-react'
import { Bien, Proprietaire, resolveMediaUrl } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type BienFormProps = {
  editingBien: Bien | null
  newBien: Partial<Bien>
  setNewBien: (bien: Partial<Bien>) => void
  proprietaires: Proprietaire[]
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function BienForm({ editingBien, newBien, setNewBien, proprietaires, onClose, onSubmit }: BienFormProps) {
  const { t } = useTranslation()

  const handleProprietaireChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = parseInt(e.target.value)
    setNewBien({ ...newBien, proprietaire: pId as any })
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...(newBien.photos || [])]
    newPhotos.splice(index, 1)
    setNewBien({ ...newBien, photos: newPhotos })
  }

  const isTerrain = newBien.type === 'TERRAIN'
  const isVente = newBien.mode_transaction === 'VENTE'
  const isLocation = newBien.mode_transaction === 'LOCATION'

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
        aria-labelledby="modal-title"
      >
        <button 
          type="button" 
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
          <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white m-0">
            {editingBien ? t("admin.biens.edit_title", 'Modifier le bien') : t("admin.biens.create_title", 'Ajouter un bien')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
            {editingBien ? t("admin.biens.edit_sub", "Mettez à jour les informations du bien immobilier.") : t("admin.biens.create_sub", "Renseignez les informations du bien immobilier.")}
          </p>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            
            <label className="sm:col-span-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("forms.property_title", "Titre *")}
              <input 
                required 
                value={newBien.titre || ''} 
                onChange={(e) => setNewBien({ ...newBien, titre: e.target.value })} 
                placeholder="Ex. Résidence Les Jardins" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("admin.biens.col_owner", "Propriétaire *")}
              <select 
                required 
                value={newBien.proprietaire?.id || newBien.proprietaire || ''} 
                onChange={handleProprietaireChange} 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{t("admin.biens.select_owner", "-- Sélectionner un propriétaire --")}</option>
                {proprietaires.map(p => (
                  <option key={p.id} value={p.id}>{p.user.prenoms} {p.user.nom}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("forms.address", "Adresse *")}
              <input 
                required 
                value={newBien.adresse || ''} 
                onChange={(e) => setNewBien({ ...newBien, adresse: e.target.value })} 
                placeholder="Ex. 12 rue de la Paix" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("forms.property_type", "Type de bien *")}
              <select 
                required 
                value={newBien.type || 'APPARTEMENT'} 
                onChange={(e) => setNewBien({ ...newBien, type: e.target.value as any })} 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="APPARTEMENT">{t("types.apartment", "Appartement")}</option>
                <option value="MAISON">{t("types.house", "Maison")}</option>
                <option value="LOCAL_COMMERCIAL">{t("types.commercial", "Local commercial")}</option>
                <option value="TERRAIN">{t("types.land", "Terrain")}</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("forms.transaction_type", "Opération *")}
              <select 
                required 
                value={newBien.mode_transaction || 'LOCATION'} 
                onChange={(e) => setNewBien({ ...newBien, mode_transaction: e.target.value as any })} 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="LOCATION">{t("card.for_rent", "Location")}</option>
                <option value="VENTE">{t("card.for_sale", "Vente")}</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("forms.surface", "Surface (m²) *")}
              <input 
                required 
                type="number" 
                step="0.01" 
                min="0" 
                value={newBien.surface || ''} 
                onChange={(e) => setNewBien({ ...newBien, surface: parseFloat(e.target.value) })} 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            {!isTerrain && (
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
                {t("forms.rooms_count", "Nombre de pièces *")}
                <input 
                  required 
                  type="number" 
                  min="0" 
                  value={newBien.nombre_pieces || ''} 
                  onChange={(e) => setNewBien({ ...newBien, nombre_pieces: parseInt(e.target.value) })} 
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            )}

            {isLocation && (
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
                {t("forms.monthly_rent", "Loyer mensuel (Ar) *")}
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={newBien.loyer_mensuel || ''} 
                  onChange={(e) => setNewBien({ ...newBien, loyer_mensuel: e.target.value })} 
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            )}
            {isVente && (
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
                {t("forms.sale_price", "Prix de vente (Ar) *")}
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={newBien.prix || ''} 
                  onChange={(e) => setNewBien({ ...newBien, prix: e.target.value })} 
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            )}
            
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              {t("forms.status", "Statut *")}
              <select 
                required 
                value={newBien.statut || 'DISPONIBLE'} 
                onChange={(e) => setNewBien({ ...newBien, statut: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DISPONIBLE">{t("dashboard.common.status_disponible", "Disponible")}</option>
                <option value="RESERVE">{t("dashboard.common.status_reserve", "Réservé")}</option>
                <option value="LOUE">{t("dashboard.common.status_loue", "Loué")}</option>
                <option value="VENDU">{t("dashboard.common.status_vendu", "Vendu")}</option>
                <option value="EN_TRAVAUX">{t("dashboard.common.status_en_travaux", "En travaux")}</option>
              </select>
            </label>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              {t("forms.property_photos", "Photos (Sélectionnez des images)")}
            </label>
            <div>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;

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
                      onError={(e) => {
                        if (dataUrl && e.currentTarget.src !== dataUrl) {
                          e.currentTarget.src = dataUrl
                        }
                      }}
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
