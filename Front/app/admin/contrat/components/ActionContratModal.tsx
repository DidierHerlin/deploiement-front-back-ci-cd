import { AlertTriangle } from 'lucide-react'
import { Contrat } from '@/lib/api'

type ActionContratModalProps = {
  contrat: Contrat
  actionType: 'resilier' | 'terminer' | 'finaliser_vente' | 'delete'
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function ActionContratModal({ contrat, actionType, onCancel, onConfirm }: ActionContratModalProps) {
  
  const getConfig = () => {
    switch (actionType) {
      case 'resilier':
        return {
          title: 'Résilier le contrat',
          desc: 'Cette action mettra fin au contrat avant son terme. Le bien repassera au statut DISPONIBLE et les échéances futures seront annulées.',
          btnText: 'Résilier',
          btnClass: 'danger-button'
        }
      case 'terminer':
        return {
          title: 'Terminer le contrat',
          desc: 'Le bail arrive à son terme naturel. Le bien sera libéré et repassera au statut DISPONIBLE.',
          btnText: 'Terminer',
          btnClass: 'primary-button'
        }
      case 'finaliser_vente':
        return {
          title: 'Finaliser la vente',
          desc: 'La vente est confirmée. Le contrat et le bien passeront définitivement au statut VENDU.',
          btnText: 'Finaliser la vente',
          btnClass: 'primary-button'
        }
      case 'delete':
        return {
          title: 'Supprimer le contrat',
          desc: 'Êtes-vous sûr de vouloir supprimer définitivement ce contrat de la base de données ? Cette action est irréversible et le bien lié sera libéré.',
          btnText: 'Supprimer',
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
        <p>Contrat #{contrat.id} — {contrat.bien_titre}</p>
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#666', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {config.desc}
        </p>
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="outline-button" onClick={onCancel}>Annuler</button>
          <button className={config.btnClass} onClick={onConfirm}>{config.btnText}</button>
        </div>
      </section>
    </div>
  )
}
