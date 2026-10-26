import { AlertTriangle } from 'lucide-react'
import { Contrat } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type ActionContratModalProps = {
  contrat: Contrat
  actionType: 'resilier' | 'terminer' | 'finaliser_vente' | 'delete'
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function ActionContratModal({ contrat, actionType, onCancel, onConfirm }: ActionContratModalProps) {
  const { t } = useTranslation()
  
  const getConfig = () => {
    switch (actionType) {
      case 'resilier':
        return {
          title: t("admin.contrats.terminate_title", 'Résilier le contrat'),
          desc: t("admin.contrats.terminate_desc", 'Cette action mettra fin au contrat avant son terme. Le bien repassera au statut DISPONIBLE et les échéances futures seront annulées.'),
          btnText: t("admin.contrats.terminate_action_btn", 'Résilier'),
          btnClass: 'danger-button'
        }
      case 'terminer':
        return {
          title: t("admin.contrats.end_lease_title", 'Terminer le contrat'),
          desc: t("admin.contrats.end_lease_desc", 'Le bail arrive à son terme naturel. Le bien sera libéré et repassera au statut DISPONIBLE.'),
          btnText: t("admin.contrats.end_lease_btn", 'Terminer'),
          btnClass: 'primary-button'
        }
      case 'finaliser_vente':
        return {
          title: t("admin.contrats.finalize_sale_title", 'Finaliser la vente'),
          desc: t("admin.contrats.finalize_sale_desc", 'La vente est confirmée. Le contrat et le bien passeront définitivement au statut VENDU.'),
          btnText: t("admin.contrats.finalize_sale_title", 'Finaliser la vente'),
          btnClass: 'primary-button'
        }
      case 'delete':
        return {
          title: t("admin.contrats.delete_contract_title", 'Supprimer le contrat'),
          desc: t("admin.contrats.delete_contract_desc", 'Êtes-vous sûr de vouloir supprimer définitivement ce contrat de la base de données ? Cette action est irréversible et le bien lié sera libéré.'),
          btnText: t("forms.delete", 'Supprimer'),
          btnClass: 'danger-button'
        }
    }
  }

  const config = getConfig()

  return (
    <div className="modal-backdrop" role="presentation" style={{ zIndex: 1200 }}>
      <section className="modal confirm-modal" role="dialog" aria-modal="true">
        <div className="modal-icon warning"><AlertTriangle size={20} /></div>
        <h2>{config.title}</h2>
        <p>{config.desc}</p>
        
        <div style={{ margin: '15px 0', padding: '10px', background: '#f8fafc', borderRadius: '4px', fontSize: '13px', textAlign: 'left' }}>
          <strong>{t("admin.contrats.col_property", "Bien")} :</strong> {contrat.bien_titre}<br />
          <strong>{t("admin.contrats.col_tenant", "Locataire / Acheteur")} :</strong> {contrat.locataire_prenoms} {contrat.locataire_nom}
        </div>

        <div className="modal-actions">
          <button className="outline-button" onClick={onCancel}>{t("forms.cancel", "Annuler")}</button>
          <button className={config.btnClass} onClick={onConfirm}>{config.btnText}</button>
        </div>
      </section>
    </div>
  )
}
