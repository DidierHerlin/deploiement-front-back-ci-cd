import { X, User } from 'lucide-react'
import { Locataire } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'

type LocataireFormProps = {
  editingLoc: Locataire | null
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
}

export function LocataireForm({ editingLoc, onClose, onSubmit }: LocataireFormProps) {
  const { t } = useTranslation()
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
      setError(err.message || t("forms.error", 'Une erreur est survenue'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ maxWidth: '600px' }}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={t("forms.close", "Fermer")}><X size={18} /></button>
        <div className="modal-icon"><User size={20} /></div>
        <h2 id="modal-title">{editingLoc ? t("admin.locataires.edit_title", 'Modifier la fiche') : t("admin.locataires.create_title", 'Créer un locataire')}</h2>
        <p>{editingLoc ? t("admin.locataires.edit_sub", "Mettez à jour les coordonnées du locataire.") : t("admin.locataires.create_sub", "Rôle : Locataire (exclusif). Ce compte permet de consulter ses contrats et quittances.")}</p>

        {error && (
          <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>{t("profile.last_name", "Nom")} *
              <input required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
            </label>
            <label style={{ flex: 1 }}>{t("profile.first_name", "Prénoms")} *
              <input required value={formData.prenoms} onChange={(e) => setFormData({ ...formData, prenoms: e.target.value })} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>{t("profile.email", "Email")} *
              <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </label>
            <label style={{ flex: 1 }}>{t("profile.phone", "Téléphone")}
              <input value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} />
            </label>
          </div>

          <label>{t("auth.password_label", "Mot de passe")} {editingLoc ? `(${t("admin.users.leave_empty_pwd", "Laissez vide pour conserver l'actuel")})` : '*'}</label>
          <input 
            type="password" 
            required={!editingLoc} 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            minLength={8}
            placeholder={editingLoc ? '••••••••' : t("admin.users.create_pwd_placeholder", 'Saisissez un mot de passe')}
          />

          <label style={{ marginTop: '10px' }}>{t("profile.contact_info", "Autre contact (optionnel)")}
            <input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Ex: Contact d'urgence..." />
          </label>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="outline-button" onClick={onClose}>{t("forms.cancel", "Annuler")}</button>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? t("forms.saving", 'Enregistrement...') : (editingLoc ? t("forms.save", 'Enregistrer les modifications') : t("admin.locataires.add_tenant", 'Créer le locataire'))}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
