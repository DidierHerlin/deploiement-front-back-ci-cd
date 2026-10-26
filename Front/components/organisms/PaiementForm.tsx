import { useState, useEffect } from 'react'
import { X, CreditCard } from 'lucide-react'
import { Paiement, validerPaiement, updatePaiement, Contrat } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type PaiementFormProps = {
  paiement: Paiement
  onClose: () => void
  onSuccess: () => void
}

export function PaiementForm({ paiement, onClose, onSuccess }: PaiementFormProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState(paiement.mode_paiement || '')
  const [reference, setReference] = useState(paiement.reference || '')
  const [montant, setMontant] = useState(paiement.montant || paiement.montant_attendu || '')
  const [estPartiel, setEstPartiel] = useState(paiement.est_partiel || false)
  const [actionType, setActionType] = useState<'VALIDER' | 'SAUVEGARDER'>('VALIDER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isMobileMoney = ['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY'].includes(mode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (actionType === 'VALIDER') {
        if (estPartiel) {
          throw new Error("Un paiement partiel ne peut pas être validé comme total. Décochez 'partiel' ou utilisez 'Sauvegarder'.")
        }
        await validerPaiement(paiement.id, mode, reference)
      } else {
        await updatePaiement(paiement.id, {
          montant: montant.toString(),
          mode_paiement: mode,
          reference: reference,
          est_partiel: estPartiel,
          statut: 'PARTIEL' // On the backend, update might handle the partiel part
        })
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message || t("forms.error", "Une erreur est survenue"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" style={{ zIndex: 1100 }}>
      <section className="modal" role="dialog" aria-modal="true" style={{ width: '90vw', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={t("forms.close", "Fermer")} style={{ top: '20px', right: '20px' }}><X size={18} /></button>
        
        <div style={{ flexShrink: 0, marginBottom: '20px' }}>
          <div className="modal-icon"><CreditCard size={20} /></div>
          <h2>{t("admin.paiements.modal_validate_title", "Enregistrer / Valider le paiement")} #{paiement.id}</h2>
          <p style={{ color: '#64748b' }}>{t("admin.contrats.col_property", "Bien")} : {paiement.bien_titre} — {t("admin.locataires.col_tenant", "Locataire")} : {paiement.locataire_nom}</p>
          
          {error && (
            <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginTop: '15px', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', display: 'grid', gridTemplateColumns: '1fr', gap: '20px', alignContent: 'start' }}>
            
            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>{t("admin.paiements.col_amount", "Montant attendu")}</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{Number(paiement.montant_attendu).toLocaleString('fr-FR')} Ar</p>
            </div>

            <label style={{ minWidth: 0 }}>{t("admin.paiements.desired_action_label", "Action souhaitée *")}
              <select value={actionType} onChange={e => setActionType(e.target.value as any)} style={{ width: '100%' }}>
                <option value="VALIDER">{t("admin.paiements.validate_full_opt", "Valider le paiement complet (Créera la quittance)")}</option>
                <option value="SAUVEGARDER">{t("admin.paiements.save_partial_opt", "Sauvegarder un paiement partiel (Sans valider)")}</option>
              </select>
            </label>

            {actionType === 'SAUVEGARDER' && (
              <>
                <label style={{ minWidth: 0 }}>{t("admin.paiements.col_paid_amount", "Montant versé *")}
                  <input type="number" step="0.01" required value={montant} onChange={e => setMontant(e.target.value)} style={{ width: '100%' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={estPartiel} onChange={e => setEstPartiel(e.target.checked)} />
                  {t("admin.paiements.is_partial_label", "Il s'agit d'un paiement partiel")}
                </label>
              </>
            )}

            <label style={{ minWidth: 0 }}>{t("admin.paiements.col_mode", "Mode de paiement *")}
              <select required value={mode} onChange={e => setMode(e.target.value)} style={{ width: '100%' }}>
                <option value="">{t("forms.select_placeholder", "-- Sélectionner --")}</option>
                <option value="MVOLA">Mvola</option>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                <option value="VIREMENT">{t("admin.paiements.mode_virement", "Virement")}</option>
                <option value="CHEQUE">{t("admin.paiements.mode_cheque", "Chèque")}</option>
                <option value="ESPECE">{t("admin.paiements.mode_especes", "Espèce")}</option>
              </select>
            </label>

            {isMobileMoney && (
              <label style={{ minWidth: 0 }}>{t("admin.paiements.transaction_ref_label", "Référence de transaction *")}
                <input required type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder={t("admin.paiements.mobile_money_ref_required", "Obligatoire pour le Mobile Money")} style={{ width: '100%' }} />
              </label>
            )}

          </div>

          <div className="modal-actions" style={{ flexShrink: 0, marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="outline-button" onClick={onClose} disabled={loading}>{t("forms.cancel", "Annuler")}</button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? t("forms.saving", 'Traitement...') : (actionType === 'VALIDER' ? t("admin.paiements.validate_payment_btn", 'Valider le paiement') : t("forms.save", 'Sauvegarder'))}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
