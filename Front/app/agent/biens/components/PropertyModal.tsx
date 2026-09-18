'use client'
import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import type { Property } from '../types'
import { getProprietaires, Proprietaire } from '@/lib/api'

const emptyForm = {
  title: '', address: '', type: 'Appartement', surface: '', rooms: '',
  rent: '', charges: '', status: 'Disponible' as Property['status'], proprietaire: 0, photos: [] as string[]
}

export type FormData = Omit<Property, 'id' | 'color'>

export default function PropertyModal({ property, onClose, onSave }: { property: Property | null; onClose: () => void; onSave: (data: FormData) => void }) {
  const [form, setForm] = useState(property ? { ...property } : emptyForm)
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([])

  useEffect(() => {
    getProprietaires().then(setProprietaires).catch(console.error)
  }, [])

  const update = (key: string, value: string | number | string[]) => setForm((c) => ({ ...c, [key]: value }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="property-modal" role="dialog" aria-modal="true" aria-labelledby="form-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="section-kicker">GESTION DU PARC</p>
            <h2 id="form-title">{property ? 'Modifier le bien' : 'Ajouter un bien'}</h2>
            <p>Renseignez les informations principales du bien.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fermer"><X size={19} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
          <div className="form-grid">
            <label>Nom du bien<input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Ex. Appartement lumineux" /></label>
            <label>Adresse<input required value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="12 rue de la Paix, Paris" /></label>
            <label>Propriétaire
              <select required value={form.proprietaire || 0} onChange={(e) => update('proprietaire', Number(e.target.value))}>
                <option value={0} disabled>Sélectionner un propriétaire</option>
                {proprietaires.map(p => (
                  <option key={p.id} value={p.id}>{p.user.prenoms} {p.user.nom}</option>
                ))}
                {/* Fallback if it's already set but not loaded */}
                {form.proprietaire && !proprietaires.find(p => p.id === form.proprietaire) && (
                  <option value={form.proprietaire}>Propriétaire #{form.proprietaire}</option>
                )}
              </select>
            </label>
            <label>Type
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                <option>Appartement</option><option>Studio</option><option>Maison</option><option>Loft</option><option>Bureau</option><option>Terrain</option>
              </select>
            </label>
            <label>Statut
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option>Disponible</option><option>Loué</option><option>Réservé</option><option>En travaux</option><option>Vendu</option>
              </select>
            </label>
            <label>Surface (m²)<input required type="number" min="1" value={form.surface} onChange={(e) => update('surface', e.target.value)} placeholder="64" /></label>
            {form.type !== 'Terrain' && (
              <label>Pièces<input type="number" min="1" value={form.rooms} onChange={(e) => update('rooms', e.target.value)} placeholder="3" /></label>
            )}
            <label>{form.status === 'Vendu' ? 'Prix de vente (Ar)' : 'Loyer mensuel (Ar)'}<input type="number" min="0" value={form.rent} onChange={(e) => update('rent', e.target.value)} placeholder="850000" /></label>
            <label>Charges (Ar)<input type="number" min="0" value={form.charges} onChange={(e) => update('charges', e.target.value)} placeholder="120000" /></label>
          </div>
          <label className="full-field">
            Photos
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                const promises = files.map(file => {
                  return new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(file)
                  })
                })
                Promise.all(promises).then(base64Photos => {
                  // Keep existing photos and add new ones
                  update('photos', [...(form.photos || []), ...base64Photos])
                })
              }}
            />
            {form.photos && form.photos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {form.photos.map((src, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 64, height: 64 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
                    <button 
                      type="button" 
                      onClick={() => update('photos', form.photos!.filter((_, i) => i !== idx))}
                      style={{ position: 'absolute', top: -6, right: -6, background: 'var(--coral)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </label>
          <div className="modal-actions">
            <button type="button" className="cancel-action" onClick={onClose}>Annuler</button>
            <button type="submit" className="primary-action">
              <Check size={15} /> {property ? 'Enregistrer les modifications' : 'Ajouter le bien'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
