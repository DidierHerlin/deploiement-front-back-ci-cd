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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (key: string, value: string | number | string[]) => setForm((c) => ({ ...c, [key]: value }))

  return (
    <div className="agent-modal-backdrop drawer" onClick={onClose}>
      <section className="agent-modal" role="dialog" aria-modal="true" aria-labelledby="form-title" onClick={(e) => e.stopPropagation()}>
        <div className="agent-modal-head">
          <div>
            <p className="eyebrow">GESTION DU PARC</p>
            <h2 id="form-title">{property ? 'Modifier le bien' : 'Ajouter un bien'}</h2>
            <p>Renseignez les informations principales du bien.</p>
          </div>
          <button className="agent-modal-close" onClick={onClose} aria-label="Fermer"><X size={19} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
          <div className="agent-form-grid">
            <label className="agent-field">Nom du bien
              <input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Ex. Appartement lumineux" />
            </label>
            <label className="agent-field">Adresse
              <input required value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Ex. Lot II M 12, Antananarivo" />
            </label>
            <label className="agent-field">Propriétaire
              <select required value={form.proprietaire || 0} onChange={(e) => update('proprietaire', Number(e.target.value))}>
                <option value={0} disabled>Sélectionner un propriétaire</option>
                {proprietaires.map(p => (
                  <option key={p.id} value={p.id}>{p.user.prenoms} {p.user.nom}</option>
                ))}
                {form.proprietaire && !proprietaires.find(p => p.id === form.proprietaire) && (
                  <option value={form.proprietaire}>Propriétaire #{form.proprietaire}</option>
                )}
              </select>
            </label>
            <label className="agent-field">Type
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                <option>Appartement</option><option>Studio</option><option>Maison</option><option>Loft</option><option>Bureau</option><option>Terrain</option>
              </select>
            </label>
            <label className="agent-field">Statut
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option>Disponible</option><option>Loué</option><option>Réservé</option><option>En travaux</option><option>Vendu</option>
              </select>
            </label>
            <label className="agent-field">Surface (m²)
              <input required type="number" min="1" value={form.surface} onChange={(e) => update('surface', e.target.value)} placeholder="64" />
            </label>
            {form.type !== 'Terrain' && (
              <label className="agent-field">Pièces
                <input type="number" min="1" value={form.rooms} onChange={(e) => update('rooms', e.target.value)} placeholder="3" />
              </label>
            )}
            <label className="agent-field">{form.status === 'Vendu' ? 'Prix de vente (Ar)' : 'Loyer mensuel (Ar)'}
              <input type="number" min="0" value={form.rent} onChange={(e) => update('rent', e.target.value)} placeholder="850000" />
            </label>
            <label className="agent-field">Charges (Ar)
              <input type="number" min="0" value={form.charges} onChange={(e) => update('charges', e.target.value)} placeholder="120000" />
            </label>
          </div>
          <label className="agent-field full" style={{ marginTop: 14 }}>
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
                  update('photos', [...(form.photos || []), ...base64Photos])
                })
              }}
            />
            {form.photos && form.photos.length > 0 && (
              <div className="agent-photo-preview">
                {form.photos.map((src, idx) => (
                  <div key={idx} className="agent-photo-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Aperçu" />
                    <button
                      type="button"
                      className="agent-photo-remove"
                      onClick={() => update('photos', form.photos!.filter((_, i) => i !== idx))}
                      aria-label="Retirer la photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </label>
          <div className="agent-modal-actions">
            <button type="button" className="agent-btn agent-btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="agent-btn agent-btn-primary">
              <Check size={15} /> {property ? 'Enregistrer' : 'Ajouter le bien'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
