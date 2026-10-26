import { UserRound, LockKeyhole, X } from 'lucide-react'
import { UserProfil } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type UserFormProps = {
  editingUser: UserProfil | null
  newUser: any
  setNewUser: (user: any) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function UserForm({ editingUser, newUser, setNewUser, onClose, onSubmit }: UserFormProps) {
  const { t } = useTranslation()

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" onClick={onClose} aria-label={t("forms.close", "Fermer")}><X size={18} /></button>
        <div className="modal-icon"><UserRound size={20} /></div>
        <h2 id="modal-title">{editingUser ? t("admin.users.edit_title", 'Modifier l’utilisateur') : t("admin.users.create_title", 'Créer un utilisateur')}</h2>
        <p>{editingUser ? t("admin.users.edit_sub", 'Mettez à jour les informations du compte.') : t("admin.users.create_sub", 'Un seul rôle actif pourra être attribué à ce compte.')}</p>
        
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>{t("profile.last_name", "Nom")}
              <input required value={newUser.nom} onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })} placeholder="Ex. Dupont" />
            </label>
            <label style={{ flex: 1 }}>{t("profile.first_name", "Prénoms")}
              <input required value={newUser.prenoms} onChange={(e) => setNewUser({ ...newUser, prenoms: e.target.value })} placeholder="Ex. Jeanne" />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>{t("profile.email", "Adresse email")}
              <input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="jeanne@email.fr" />
            </label>
            <label style={{ flex: 1 }}>{t("profile.phone", "Téléphone")}
              <input type="text" value={newUser.telephone} onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })} placeholder="034 00 000 00" />
            </label>
          </div>
          <label>{t("profile.role", "Rôle")}
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="Admin">{t("dashboard.roles.ADMIN", "Admin")}</option>
              <option value="Agent">{t("dashboard.roles.AGENT", "Agent")}</option>
              <option value="Propriétaire">{t("dashboard.roles.PROPRIETAIRE", "Propriétaire")}</option>
              <option value="Locataire">{t("dashboard.roles.LOCATAIRE", "Locataire")}</option>
            </select>
          </label>
          <label>{t("auth.password_label", "Mot de passe")} {editingUser && <span style={{fontWeight:'normal', fontSize:'10px'}}>({t("admin.users.leave_empty_pwd", "Laisser vide pour ne pas modifier")})</span>}
            <input type={editingUser ? "password" : "text"} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder={editingUser ? "********" : t("admin.users.create_pwd_placeholder", "Créer un mot de passe")} />
          </label>
          
          {!editingUser && (
            <div className="password-note">
              <LockKeyhole size={15} />
              <span>{t("admin.users.pwd_security_note", "Le mot de passe sera haché. Il doit contenir au moins 8 caractères, une majuscule et un chiffre.")}</span>
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" className="outline-button" onClick={onClose}>{t("forms.cancel", "Annuler")}</button>
            <button className="primary-button" type="submit">{editingUser ? t("forms.save", 'Enregistrer') : t("admin.users.create_account_btn", 'Créer le compte')}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
