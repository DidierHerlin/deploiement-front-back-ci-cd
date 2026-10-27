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
          isDanger: true
        }
      case 'terminer':
        return {
          title: t("admin.contrats.end_lease_title", 'Terminer le contrat'),
          desc: t("admin.contrats.end_lease_desc", 'Le bail arrive à son terme naturel. Le bien sera libéré et repassera au statut DISPONIBLE.'),
          btnText: t("admin.contrats.end_lease_btn", 'Terminer'),
          isDanger: false
        }
      case 'finaliser_vente':
        return {
          title: t("admin.contrats.finalize_sale_title", 'Finaliser la vente'),
          desc: t("admin.contrats.finalize_sale_desc", 'La vente est confirmée. Le contrat et le bien passeront définitivement au statut VENDU.'),
          btnText: t("admin.contrats.finalize_sale_title", 'Finaliser la vente'),
          isDanger: false
        }
      case 'delete':
        return {
          title: t("admin.contrats.delete_contract_title", 'Supprimer le contrat'),
          desc: t("admin.contrats.delete_contract_desc", 'Êtes-vous sûr de vouloir supprimer définitivement ce contrat de la base de données ? Cette action est irréversible et le bien lié sera libéré.'),
          btnText: t("forms.delete", 'Supprimer'),
          isDanger: true
        }
    }
  }

  const config = getConfig()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="presentation">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative flex flex-col items-center text-center" 
        role="dialog" 
        aria-modal="true"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          config.isDanger 
            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' 
            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
        }`}>
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{config.title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{config.desc}</p>
        
        <div className="w-full mb-6 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-xs space-y-1">
          <div>
            <span className="text-slate-500 dark:text-slate-400">{t("admin.contrats.col_property", "Bien")} : </span>
            <strong className="text-slate-900 dark:text-slate-100">{contrat.bien_titre}</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">{t("admin.contrats.col_tenant", "Locataire / Acheteur")} : </span>
            <strong className="text-slate-900 dark:text-slate-100">{contrat.locataire_prenoms} {contrat.locataire_nom}</strong>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 w-full">
          <button 
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors" 
            onClick={onCancel}
          >
            {t("forms.cancel", "Annuler")}
          </button>
          <button 
            className={`px-4 py-2 text-xs font-medium rounded-lg text-white transition-colors ${
              config.isDanger 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`} 
            onClick={onConfirm}
          >
            {config.btnText}
          </button>
        </div>
      </div>
    </div>
  )
}
