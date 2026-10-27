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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section 
        className="w-full max-w-[560px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
      >
        <button 
          type="button" 
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer" 
          onClick={onClose} 
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>
        
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/20">
          <User size={20} />
        </div>

        <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white m-0">
          {editingLoc ? t("admin.locataires.edit_title", 'Modifier la fiche') : t("admin.locataires.create_title", 'Créer un locataire')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {editingLoc 
            ? t("admin.locataires.edit_sub", "Mettez à jour les coordonnées du locataire.") 
            : t("admin.locataires.create_sub", "Rôle : Locataire (exclusif). Ce compte permet de consulter ses contrats et quittances.")}
        </p>

        {error && (
          <div className="p-3 rounded-lg text-xs bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 mb-3">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex gap-2.5">
            <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              <span>{t("profile.last_name", "Nom")} *</span>
              <input 
                required 
                value={formData.nom} 
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })} 
                placeholder="Ex. Dupont" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              <span>{t("profile.first_name", "Prénoms")} *</span>
              <input 
                required 
                value={formData.prenoms} 
                onChange={(e) => setFormData({ ...formData, prenoms: e.target.value })} 
                placeholder="Ex. Marie" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="flex gap-2.5">
            <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              <span>{t("profile.email", "Email")} *</span>
              <input 
                required 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                placeholder="marie.dupont@example.com" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
              <span>{t("profile.phone", "Téléphone")}</span>
              <input 
                value={formData.telephone} 
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} 
                placeholder="0340000000" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
            <span>{t("auth.password_label", "Mot de passe")} {editingLoc ? `(${t("admin.users.leave_empty_pwd", "Laissez vide pour conserver l'actuel")})` : '*'}</span>
            <input 
              type="password" 
              required={!editingLoc} 
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              minLength={8}
              placeholder={editingLoc ? '••••••••' : t("admin.users.create_pwd_placeholder", 'Saisissez un mot de passe (min 8 car.)')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
            <span>{t("profile.contact_info", "Autre contact (optionnel)")}</span>
            <input 
              value={formData.contact} 
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })} 
              placeholder="Ex: Contact d'urgence..." 
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button 
              type="button" 
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
              onClick={onClose}
            >
              {t("forms.cancel", "Annuler")}
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? t("forms.saving", 'Enregistrement...') : (editingLoc ? t("forms.save", 'Enregistrer les modifications') : t("admin.locataires.add_tenant", 'Créer le locataire'))}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
