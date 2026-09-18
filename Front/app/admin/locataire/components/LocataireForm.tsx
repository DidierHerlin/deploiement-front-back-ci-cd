import { X, User } from 'lucide-react'
import { Locataire } from '@/lib/api'
import { useState, useEffect } from 'react'

type LocataireFormProps = {
  editingLoc: Locataire | null
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
}

export function LocataireForm({ editingLoc, onClose, onSubmit }: LocataireFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    prenoms: '',
    email: '',
    telephone: '',
    password: '',
    contact: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingLoc) {
      setFormData({
        nom: editingLoc.user?.nom || '',
        prenoms: editingLoc.user?.prenoms || '',
        email: editingLoc.user?.email || '',
        telephone: editingLoc.user?.telephone || '',
        password: '',
        contact: editingLoc.contact || ''
      })
    }
  }, [editingLoc])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const payload: any = { ...formData }
    if (editingLoc && !payload.password) {
      delete payload.password
    }

    try {
      await onSubmit(payload)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ maxWidth: '600px' }}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        <div className="modal-icon"><User size={20} /></div>
        <h2 id="modal-title">{editingLoc ? 'Modifier la fiche' : 'Créer un locataire'}</h2>
        <p>Rôle : <strong>Locataire</strong> (exclusif). Ce compte permet de se connecter pour consulter ses contrats et paiements.</p>

        {error && (
          <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>Nom *
              <input required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
            </label>
            <label style={{ flex: 1 }}>Prénoms *
              <input required value={formData.prenoms} onChange={(e) => setFormData({ ...formData, prenoms: e.target.value })} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>Email *
              <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </label>
            <label style={{ flex: 1 }}>Téléphone
              <input value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} />
            </label>
          </div>

          <label>Mot de passe {editingLoc ? '(Laissez vide pour conserver l\'actuel)' : '*'}</label>
          <input 
            type="password" 
            required={!editingLoc} 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            minLength={8}
            placeholder={editingLoc ? '••••••••' : 'Saisissez un mot de passe'}
          />

          <label style={{ marginTop: '10px' }}>Autre contact (optionnel)
            <input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Ex: Contact d'urgence..." />
          </label>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="outline-button" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Enregistrement...' : (editingLoc ? 'Enregistrer les modifications' : 'Créer le locataire')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
