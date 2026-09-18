import { X, UserRound } from 'lucide-react'
import { Proprietaire } from '@/lib/api'
import { useState, useEffect } from 'react'

type ProprietaireFormProps = {
  editingProp: Proprietaire | null
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
}

export function ProprietaireForm({ editingProp, onClose, onSubmit }: ProprietaireFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    prenoms: '',
    email: '',
    telephone: '',
    password: '',
    iban: '',
    contact: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingProp) {
      setFormData({
        nom: editingProp.user?.nom || '',
        prenoms: editingProp.user?.prenoms || '',
        email: editingProp.user?.email || '',
        telephone: editingProp.user?.telephone || '',
        password: '', // On ne remplit pas le mot de passe en modification
        iban: editingProp.iban || '',
        contact: editingProp.contact || ''
      })
    }
  }, [editingProp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Si on modifie et que le mot de passe est vide, on ne l'envoie pas
    const payload: any = { ...formData }
    if (editingProp && !payload.password) {
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
        <div className="modal-icon"><UserRound size={20} /></div>
        <h2 id="modal-title">{editingProp ? 'Modifier la fiche' : 'Créer un propriétaire'}</h2>
        <p>
          Rôle : <strong>Propriétaire</strong> (exclusif, RG-01). 
          L'utilisateur recevra un accès pour gérer ses biens.
        </p>

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

          <label>Mot de passe {editingProp ? '(Laissez vide pour conserver l\'actuel)' : '*'}</label>
          <input 
            type="password" 
            required={!editingProp} 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            minLength={8}
            placeholder={editingProp ? '••••••••' : 'Saisissez un mot de passe'}
          />

          <h3 style={{ fontSize: '14px', marginTop: '20px', marginBottom: '10px', color: '#334155' }}>Informations financières</h3>
          
          <label>IBAN (Reversements au propriétaire) *
            <input required value={formData.iban} onChange={(e) => setFormData({ ...formData, iban: e.target.value })} placeholder="FR76 1234..." />
          </label>

          <label>Autre contact (optionnel)
            <input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Ex: Contact d'urgence..." />
          </label>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="outline-button" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Enregistrement...' : (editingProp ? 'Enregistrer les modifications' : 'Créer le propriétaire')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
