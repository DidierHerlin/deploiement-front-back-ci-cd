import { X, UserRound, Building2 } from 'lucide-react'
import { Proprietaire } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type ProprietaireModalProps = {
  proprietaire: Proprietaire
  onClose: () => void
  onManageBiens: () => void
}

export function ProprietaireModal({ proprietaire, onClose, onManageBiens }: ProprietaireModalProps) {
  const { t } = useTranslation()
  const user = proprietaire.user
  const isActive = user?.is_active ?? true

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="modal-close" onClick={onClose} aria-label={t("forms.close", "Fermer")}><X size={18} /></button>
        <div className="modal-icon"><UserRound size={20} /></div>
        <h2 id="detail-title">{t("admin.proprietaires.sheet_title", "Fiche Propriétaire")}</h2>
        
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
          <div>
            <small style={{ color: '#586577' }}>{t("profile.full_name", "Nom et prénoms")}</small>
            <p style={{ fontWeight: 500 }}>{user?.prenoms} {user?.nom}</p>
          </div>
          <div>
            <small style={{ color: '#586577' }}>{t("profile.email", "Email")}</small>
            <p style={{ fontWeight: 500 }}>{user?.email}</p>
          </div>
          <div>
            <small style={{ color: '#586577' }}>{t("profile.phone", "Téléphone")}</small>
            <p style={{ fontWeight: 500 }}>{user?.telephone || t("profile.not_provided", 'Non renseigné')}</p>
          </div>
          <div>
            <small style={{ color: '#586577' }}>{t("admin.proprietaires.account_status", "Statut du compte")}</small>
            <p style={{ fontWeight: 500 }}>
              {isActive ? <span style={{ color: '#16a34a' }}>{t("dashboard.common.active", "Actif")}</span> : <span style={{ color: '#dc2626' }}>{t("dashboard.common.inactive", "Désactivé")}</span>}
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1', padding: '10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#586577', display: 'block', marginBottom: '5px' }}>{t("admin.proprietaires.financial_info", "Informations financières")}</small>
            <p style={{ fontWeight: 500, fontSize: '13px' }}>{t("profile.iban", "IBAN (Reversements)")} : {proprietaire.iban}</p>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '30px' }}>
          <button className="outline-button" onClick={onClose}>{t("forms.close", "Fermer")}</button>
          <button className="primary-button" onClick={onManageBiens}><Building2 size={15} /> {t("admin.proprietaires.manage_properties_btn", "Gérer ses biens")}</button>
        </div>
      </section>
    </div>
  )
}
