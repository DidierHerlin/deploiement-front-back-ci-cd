'use client'

import { useState } from 'react'
import { X, CreditCard } from 'lucide-react'
import { Paiement, validerPaiement, updatePaiement } from '@/lib/api'
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
          statut: 'PARTIEL'
        })
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message || t("forms.error", "Une erreur est survenue"))
    } finally {
      setLoading(false)
    }
  }

  const montantAffiche = Number(paiement.montant_attendu || paiement.montant || 0).toLocaleString('fr-FR')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          onClick={onClose}
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>

        <div className="shrink-0 mb-4">
          <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <CreditCard size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">
            {t("admin.paiements.modal_validate_title", "Enregistrer / Valider le paiement")} #{paiement.id}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
            {t("admin.contrats.col_property", "Bien")} : <strong className="text-slate-700 dark:text-slate-300 font-medium">{paiement.bien_titre}</strong> — {t("admin.locataires.col_tenant", "Locataire")} : <strong className="text-slate-700 dark:text-slate-300 font-medium">{paiement.locataire_nom}</strong>
          </p>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl text-xs mt-3">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            
            {/* Encadré MONTANT harmonisé Dark Mode */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                {t("admin.paiements.col_amount", "MONTANT")}
              </p>
              <p className="text-slate-900 dark:text-white text-xl font-bold m-0">
                {montantAffiche} Ar
              </p>
            </div>

            {/* Action souhaitée */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t("admin.paiements.desired_action_label", "Action souhaitée *")}
              </label>
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="VALIDER" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {t("admin.paiements.validate_full_opt", "Valider le paiement complet (Créera la quittance)")}
                </option>
                <option value="SAUVEGARDER" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {t("admin.paiements.save_partial_opt", "Sauvegarder un paiement partiel (Sans valider)")}
                </option>
              </select>
            </div>

            {actionType === 'SAUVEGARDER' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t("admin.paiements.col_paid_amount", "Montant versé *")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={montant}
                    onChange={e => setMontant(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
                <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={estPartiel}
                    onChange={e => setEstPartiel(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{t("admin.paiements.is_partial_label", "Il s'agit d'un paiement partiel")}</span>
                </label>
              </div>
            )}

            {/* Mode de paiement */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t("admin.paiements.col_mode", "MODE DE PAIEMENT *")}
              </label>
              <select
                required
                value={mode}
                onChange={e => setMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {t("forms.select_placeholder", "-- Sélectionner --")}
                </option>
                <option value="MVOLA" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mvola</option>
                <option value="ORANGE_MONEY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Orange Money</option>
                <option value="AIRTEL_MONEY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Airtel Money</option>
                <option value="VIREMENT" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {t("admin.paiements.mode_virement", "Virement")}
                </option>
                <option value="CHEQUE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {t("admin.paiements.mode_cheque", "Chèque")}
                </option>
                <option value="ESPECE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {t("admin.paiements.mode_especes", "Espèce")}
                </option>
              </select>
            </div>

            {/* Référence pour Mobile Money */}
            {isMobileMoney && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t("admin.paiements.transaction_ref_label", "Référence de transaction *")}
                </label>
                <input
                  required
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder={t("admin.paiements.mobile_money_ref_required", "Obligatoire pour le Mobile Money")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            )}

          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-5 shrink-0">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              onClick={onClose}
              disabled={loading}
            >
              {t("forms.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              disabled={loading}
            >
              {loading
                ? t("forms.saving", 'Traitement...')
                : actionType === 'VALIDER'
                ? t("admin.paiements.validate_payment_btn", 'Valider le paiement')
                : t("forms.save", 'Sauvegarder')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
