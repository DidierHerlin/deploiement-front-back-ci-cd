import { X, UserRound } from 'lucide-react'
import { Proprietaire } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'

type ProprietaireFormProps = {
  editingProp: Proprietaire | null
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
}

export function ProprietaireForm({ editingProp, onClose, onSubmit }: ProprietaireFormProps) {
  const { t } = useTranslation()
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
      setError(err.message || t("forms.error", 'Une erreur est survenue'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ maxWidth: '600px' }}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={t("forms.close", "Fermer")}><X size={18} /></button>
        <div className="modal-icon"><UserRound size={20} /></div>
        <h2 id="modal-title">{editingProp ? t("admin.proprietaires.edit_title", 'Modifier la fiche') : t("admin.proprietaires.create_title", 'Créer un propriétaire')}</h2>
        <p>
          {editingProp ? t("admin.proprietaires.edit_sub", "Mettez à jour les informations du bailleur.") : t("admin.proprietaires.create_sub", "Rôle : Propriétaire (exclusif). L'utilisateur recevra un accès pour gérer ses biens.")}
        </p>

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

          <label>{t("auth.password_label", "Mot de passe")} {editingProp ? `(${t("admin.users.leave_empty_pwd", "Laissez vide pour conserver l'actuel")})` : '*'}</label>
          <input 
            type="password" 
            required={!editingProp} 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            minLength={8}
            placeholder={editingProp ? "********" : t("admin.users.create_pwd_placeholder", "Créer un mot de passe")}
          />

          <label style={{ marginTop: '10px' }}>{t("profile.iban", "IBAN (Coordonnées bancaires)")} *
            <input required value={formData.iban} onChange={(e) => setFormData({ ...formData, iban: e.target.value })} placeholder="FR76..." />
          </label>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="outline-button" onClick={onClose}>{t("forms.cancel", "Annuler")}</button>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? t("forms.saving", 'Enregistrement...') : (editingProp ? t("forms.save", 'Enregistrer les modifications') : t("admin.proprietaires.add_owner", 'Créer le propriétaire'))}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
