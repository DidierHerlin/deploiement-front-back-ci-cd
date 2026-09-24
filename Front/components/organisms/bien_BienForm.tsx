import { useState } from 'react'
import { X, Building2, Trash2 } from 'lucide-react'
import { Bien, Proprietaire } from '@/lib/api'

type BienFormProps = {
  editingBien: Bien | null
  newBien: Partial<Bien>
  setNewBien: (bien: Partial<Bien>) => void
  proprietaires: Proprietaire[]
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function BienForm({ editingBien, newBien, setNewBien, proprietaires, onClose, onSubmit }: BienFormProps) {
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
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ width: '90vw', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer" style={{ top: '20px', right: '20px' }}><X size={18} /></button>
        
        <div style={{ flexShrink: 0, marginBottom: '20px' }}>
          <div className="modal-icon"><Building2 size={20} /></div>
          <h2 id="modal-title">{editingBien ? 'Modifier le bien' : 'Ajouter un bien'}</h2>
          <p>Renseignez les informations du bien immobilier.</p>
        </div>
        
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignContent: 'start' }}>
            
            <label style={{ gridColumn: '1 / -1', minWidth: 0 }}>Titre *
              <input required value={newBien.titre || ''} onChange={(e) => setNewBien({ ...newBien, titre: e.target.value })} placeholder="Ex. Résidence Les Jardins" style={{ width: '100%', textOverflow: 'ellipsis' }} />
            </label>

            <label style={{ minWidth: 0 }}>Propriétaire *
              <select required value={newBien.proprietaire?.id || newBien.proprietaire || ''} onChange={handleProprietaireChange} style={{ width: '100%', textOverflow: 'ellipsis' }}>
                <option value="">-- Sélectionner un propriétaire --</option>
                {proprietaires.map(p => (
                  <option key={p.id} value={p.id}>{p.user.prenoms} {p.user.nom}</option>
                ))}
              </select>
            </label>

            <label style={{ minWidth: 0 }}>Adresse *
              <input required value={newBien.adresse || ''} onChange={(e) => setNewBien({ ...newBien, adresse: e.target.value })} placeholder="Ex. 12 rue de la Paix" style={{ width: '100%', textOverflow: 'ellipsis' }} />
            </label>

            <label style={{ minWidth: 0 }}>Type de bien *
              <select required value={newBien.type || 'APPARTEMENT'} onChange={(e) => setNewBien({ ...newBien, type: e.target.value as any })} style={{ width: '100%', textOverflow: 'ellipsis' }}>
                <option value="APPARTEMENT">Appartement</option>
                <option value="MAISON">Maison</option>
                <option value="LOCAL_COMMERCIAL">Local commercial</option>
                <option value="TERRAIN">Terrain</option>
              </select>
            </label>

            <label style={{ minWidth: 0 }}>Opération *
              <select required value={newBien.mode_transaction || 'LOCATION'} onChange={(e) => setNewBien({ ...newBien, mode_transaction: e.target.value as any })} style={{ width: '100%', textOverflow: 'ellipsis' }}>
                <option value="LOCATION">Location</option>
                <option value="VENTE">Vente</option>
              </select>
            </label>

            <label>Surface (m²) *
              <input required type="number" step="0.01" min="0" value={newBien.surface || ''} onChange={(e) => setNewBien({ ...newBien, surface: parseFloat(e.target.value) })} />
            </label>

            {!isTerrain && (
              <label>Nombre de pièces *
                <input required type="number" min="0" value={newBien.nombre_pieces || ''} onChange={(e) => setNewBien({ ...newBien, nombre_pieces: parseInt(e.target.value) })} />
              </label>
            )}

            {isLocation && (
              <label style={{ flex: 1 }}>Loyer mensuel (Ar) *
                <input required type="number" step="0.01" min="0" value={newBien.loyer_mensuel || ''} onChange={(e) => setNewBien({ ...newBien, loyer_mensuel: e.target.value })} />
              </label>
            )}
            {isVente && (
              <label style={{ flex: 1 }}>Prix de vente (Ar) *
                <input required type="number" step="0.01" min="0" value={newBien.prix || ''} onChange={(e) => setNewBien({ ...newBien, prix: e.target.value })} />
              </label>
            )}
            
            <label style={{ flex: 1 }}>Statut *
              <select required value={newBien.statut || 'DISPONIBLE'} onChange={(e) => setNewBien({ ...newBien, statut: e.target.value as any })}>
                <option value="DISPONIBLE">Disponible</option>
                <option value="RESERVE">Réservé</option>
                <option value="LOUE">Loué</option>
                <option value="VENDU">Vendu</option>
                <option value="EN_TRAVAUX">En travaux</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>Photos (Sélectionnez des images)
              <div style={{ marginTop: '5px' }}>
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
                      alert("Erreur lors de la sélection des images.");
                    }
                    e.target.value = '';
                  }}
                  style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                />
              </div>
            
              {newBien.photos && newBien.photos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {newBien.photos.map((dataUrl, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img src={dataUrl} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                      <button 
                        type="button" 
                        onClick={() => handleRemovePhoto(idx)}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,255,255,0.9)', color: '#ef4444', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </label>
          </div>

          <div className="modal-actions" style={{ flexShrink: 0, marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="outline-button" onClick={onClose}>Annuler</button>
            <button type="submit" className="primary-button">{editingBien ? 'Enregistrer les modifications' : 'Ajouter le bien'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
