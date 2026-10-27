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
          <UserRound size={20} />
        </div>

        <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white m-0">
          {editingProp ? t("admin.proprietaires.edit_title", 'Modifier la fiche') : t("admin.proprietaires.create_title", 'Créer un propriétaire')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {editingProp 
            ? t("admin.proprietaires.edit_sub", "Mettez à jour les informations du bailleur.") 
            : t("admin.proprietaires.create_sub", "Rôle : Propriétaire (exclusif). L'utilisateur recevra un accès pour gérer ses biens.")}
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
                placeholder="Ex. Jean" 
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
                placeholder="jean.dupont@example.com" 
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
            <span>{t("auth.password_label", "Mot de passe")} {editingProp ? `(${t("admin.users.leave_empty_pwd", "Laissez vide pour conserver l'actuel")})` : '*'}</span>
            <input 
              type="password" 
              required={!editingProp} 
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              minLength={8}
              placeholder={editingProp ? "********" : t("admin.users.create_pwd_placeholder", "Créer un mot de passe (min 8 car.)")}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
            <span>{t("profile.iban", "IBAN (Coordonnées bancaires)")} *</span>
            <input 
              required 
              value={formData.iban} 
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })} 
              placeholder="FR76 3000 6000 0112 3456 7890 123" 
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              {loading ? t("forms.saving", 'Enregistrement...') : (editingProp ? t("forms.save", 'Enregistrer les modifications') : t("admin.proprietaires.add_owner", 'Créer le propriétaire'))}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
