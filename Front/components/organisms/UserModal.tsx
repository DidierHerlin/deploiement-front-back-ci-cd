import { UserRound, X } from 'lucide-react'
import { UserProfil } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type UserModalProps = {
  user: UserProfil
  onClose: () => void
  onEdit: () => void
}

export function UserModal({ user, onClose, onEdit }: UserModalProps) {
  const { t } = useTranslation()

  const formatRole = (r: string) => {
    switch (r) {
      case 'ADMIN': return t("dashboard.roles.ADMIN", 'Admin')
      case 'AGENT': return t("dashboard.roles.AGENT", 'Agent')
      case 'PROPRIETAIRE': return t("dashboard.roles.PROPRIETAIRE", 'Propriétaire')
      case 'LOCATAIRE': return t("dashboard.roles.LOCATAIRE", 'Locataire')
      default: return r
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="view-title">
        <button className="modal-close" onClick={onClose} aria-label={t("forms.close", "Fermer")}><X size={18} /></button>
        <div className="modal-icon"><UserRound size={20} /></div>
        <h2 id="view-title">{t("admin.users.user_details_title", "Détails de l'utilisateur")}</h2>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '13px', color: '#394454' }}>
          <div><strong>{t("profile.full_name", "Nom complet :")}</strong> {user.prenoms} {user.nom}</div>
          <div><strong>{t("profile.email", "Email :")}</strong> {user.email}</div>
          <div><strong>{t("profile.phone", "Téléphone :")}</strong> {user.telephone || t("profile.not_provided", 'Non renseigné')}</div>
          <div><strong>{t("profile.role", "Rôle :")}</strong> <span className="role-badge">{formatRole(user.role)}</span></div>
          <div><strong>{t("forms.status", "Statut :")}</strong> <span className={`status ${user.is_active ? 'paid' : 'disabled'}`}><i />{user.is_active ? t("dashboard.common.active", 'Actif') : t("dashboard.common.inactive", 'Inactif')}</span></div>
          <div><strong>{t("profile.registered_on", "Date d'inscription :")}</strong> {new Date(user.date_creation).toLocaleString('fr-FR')}</div>
        </div>
        <div className="modal-actions" style={{ marginTop: '25px' }}>
          <button className="outline-button" onClick={onClose}>{t("forms.close", "Fermer")}</button>
          <button className="primary-button" onClick={onEdit}>{t("forms.edit", "Modifier")}</button>
        </div>
      </section>
    </div>
  )
}
