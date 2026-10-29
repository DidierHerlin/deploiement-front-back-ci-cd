'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
} from 'lucide-react'
import { Paiement, DemandePaiement, creerDemandePaiement } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

interface DemandePaiementModalProps {
  isOpen: boolean
  facture: Paiement | null
  facturesEligibles?: Paiement[]
  onClose: () => void
  onSuccess: (demande: DemandePaiement) => void
}

type ProviderType = 'MVOLA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY'

export function DemandePaiementModal({
  isOpen,
  facture: initialFacture,
  facturesEligibles = [],
  onClose,
  onSuccess,
}: DemandePaiementModalProps) {
  const { t } = useTranslation()
  const [selectedFacture, setSelectedFacture] = useState<Paiement | null>(
    initialFacture || (facturesEligibles.length > 0 ? facturesEligibles[0] : null)
  )
  const [moyenPaiement, setMoyenPaiement] = useState<ProviderType>('MVOLA')
  const [telephone, setTelephone] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successDemande, setSuccessDemande] = useState<DemandePaiement | null>(null)

  useEffect(() => {
    if (initialFacture) {
      setSelectedFacture(initialFacture)
    } else if (facturesEligibles.length > 0 && !selectedFacture) {
      setSelectedFacture(facturesEligibles[0])
    }
  }, [initialFacture, facturesEligibles])

  if (!isOpen) return null

  const montantEffectif = selectedFacture
    ? selectedFacture.montant_attendu || selectedFacture.montant || '0'
    : '0'

  const montantFormatted = parseFloat(montantEffectif as string).toLocaleString('fr-FR', {
    maximumFractionDigits: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedFacture) {
      setError(t('locataire_pages.paiements.select_invoice_error', 'Veuillez sélectionner une facture éligible.'))
      return
    }

    if (!moyenPaiement) {
      setError(t('locataire_pages.paiements.select_operator_error', 'Veuillez sélectionner un opérateur Mobile Money.'))
      return
    }

    if (!telephone.trim()) {
      setError(t('locataire_pages.paiements.phone_required', 'Le numéro de téléphone Mobile Money est requis.'))
      return
    }

    setLoading(true)
    try {
      const res = await creerDemandePaiement({
        facture: selectedFacture.id,
        moyen_paiement: moyenPaiement,
        telephone: telephone.trim(),
        reference: reference.trim() || undefined,
        montant: parseFloat(montantEffectif as string),
      })
      setSuccessDemande(res)
      onSuccess(res)
    } catch (err: any) {
      let msg = err.message || t('common.error_occurred', 'Une erreur est survenue lors de la soumission.')
      try {
        const parsed = JSON.parse(msg.replace(/^Erreur API \(\d+\)[^:]*:\s*/, ''))
        if (parsed.facture) msg = Array.isArray(parsed.facture) ? parsed.facture[0] : parsed.facture
        else if (parsed.montant) msg = Array.isArray(parsed.montant) ? parsed.montant[0] : parsed.montant
        else if (parsed.moyen_paiement) msg = Array.isArray(parsed.moyen_paiement) ? parsed.moyen_paiement[0] : parsed.moyen_paiement
        else if (parsed.non_field_errors) msg = Array.isArray(parsed.non_field_errors) ? parsed.non_field_errors[0] : parsed.non_field_errors
      } catch {
        // Keep raw
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResetAndClose = () => {
    setSuccessDemande(null)
    setError(null)
    setTelephone('')
    setReference('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[560px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Smartphone size={22} />
            </div>
            <div>
              <h2 className="m-0 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t('locataire_pages.paiements.modal_title', 'Demande de paiement Mobile Money')}
              </h2>
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
                {t('locataire_pages.paiements.modal_subtitle', 'Règlement sécurisé de votre facture du mois à venir')}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            aria-label={t('common.close', 'Fermer')}
            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          {successDemande ? (
            /* Confirmation Step */
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {t('locataire_pages.paiements.success_title', 'Demande transmise avec succès !')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                {t('locataire_pages.paiements.success_desc', 'Votre demande de paiement a bien été enregistrée dans la base de données. Elle est actuellement en attente de validation par le gestionnaire.')}
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-left mb-5 text-xs sm:text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Numéro de demande :</span>
                  <strong className="text-slate-900 dark:text-slate-100">#{successDemande.id}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Bien concerné :</span>
                  <strong className="text-slate-900 dark:text-slate-100">{successDemande.bien_titre}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Mois d'échéance :</span>
                  <strong className="text-slate-900 dark:text-slate-100">{successDemande.mois_echeance_facture}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Moyen de paiement :</span>
                  <span
                    className={`font-semibold ${
                      successDemande.moyen_paiement === 'MVOLA'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : successDemande.moyen_paiement === 'ORANGE_MONEY'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {successDemande.moyen_paiement}
                  </span>
                </div>
                {successDemande.telephone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Téléphone :</span>
                    <strong className="text-slate-900 dark:text-slate-100">{successDemande.telephone}</strong>
                  </div>
                )}
                {successDemande.reference && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Référence transaction :</span>
                    <strong className="text-slate-900 dark:text-slate-100">{successDemande.reference}</strong>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Montant :</span>
                  <strong className="text-base text-emerald-600 dark:text-emerald-400 font-bold">
                    {parseFloat(successDemande.montant).toLocaleString('fr-FR')} Ar
                  </strong>
                </div>
              </div>

              <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 rounded-xl p-3.5 mb-5 text-xs text-blue-800 dark:text-blue-300 text-left flex gap-2.5 items-start">
                <ShieldCheck size={18} className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span>
                  <strong>Note importante :</strong> Conformément aux règles de gestion, votre facture reste au statut "En attente" jusqu'à la validation définitive de la transaction par l'agence.
                </span>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {t('common.close', 'Fermer')}
              </button>
            </div>
          ) : (
            /* Form Step */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Règle métier explicite */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300 flex gap-2.5 items-start">
                <ShieldCheck size={18} className="flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <strong>Règle de facturation :</strong> Le règlement des factures s'effectue dans l'<strong>ordre chronologique</strong>. La facture impayée la plus ancienne doit être réglée en priorité. Modes acceptés : exclusivement Mobile Money.
                </div>
              </div>

              {/* Sélection / Résumé de la Facture */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('locataire_pages.paiements.select_invoice', 'Facture mensuelle à régler')}
                </label>
                {facturesEligibles.length > 1 ? (
                  <select
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    value={selectedFacture?.id || ''}
                    onChange={(e) => {
                      const found = facturesEligibles.find((f) => f.id === parseInt(e.target.value))
                      if (found) setSelectedFacture(found)
                    }}
                  >
                    {facturesEligibles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.bien_titre} — {f.message_mois || f.date_echeance} (
                        {parseFloat((f.montant_attendu || f.montant || 0) as string).toLocaleString('fr-FR')} Ar)
                      </option>
                    ))}
                  </select>
                ) : selectedFacture ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-950">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {selectedFacture.bien_titre}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                        Échéance prioritaire autorisée
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Échéance : <strong className="text-slate-700 dark:text-slate-300">{selectedFacture.date_echeance ? new Date(selectedFacture.date_echeance).toLocaleDateString('fr-FR') : '-'}</strong>
                      </span>
                      <span>
                        Période : <strong className="text-slate-700 dark:text-slate-300">{selectedFacture.message_mois || 'Mois à venir'}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg text-xs">
                    Aucune facture éligible pour le mois à venir n'a été trouvée.
                  </div>
                )}
              </div>

              {/* Montant réel à payer */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/50 rounded-xl p-3.5 sm:p-4 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider block">
                    Montant exact de la facture
                  </span>
                  <p className="m-0 text-xs text-indigo-600/80 dark:text-indigo-400/80">
                    Conforme au loyer contractuel
                  </p>
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-indigo-900 dark:text-indigo-200">
                  {montantFormatted} Ar
                </div>
              </div>

              {/* Sélection Opérateur Mobile Money (EXCLUSIVEMENT) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t('locataire_pages.paiements.select_operator', 'Moyen de paiement (Exclusivement Mobile Money)')}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* MVOLA */}
                  <label
                    className={`rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center gap-1 border-2 ${
                      moyenPaiement === 'MVOLA'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="moyen_paiement"
                      value="MVOLA"
                      checked={moyenPaiement === 'MVOLA'}
                      onChange={() => setMoyenPaiement('MVOLA')}
                      className="sr-only"
                    />
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center">
                      M
                    </div>
                    <strong className="text-xs text-slate-900 dark:text-white">Mvola</strong>
                    <small className="text-[10px] text-slate-500 dark:text-slate-400">Telma</small>
                  </label>

                  {/* ORANGE MONEY */}
                  <label
                    className={`rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center gap-1 border-2 ${
                      moyenPaiement === 'ORANGE_MONEY'
                        ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="moyen_paiement"
                      value="ORANGE_MONEY"
                      checked={moyenPaiement === 'ORANGE_MONEY'}
                      onChange={() => setMoyenPaiement('ORANGE_MONEY')}
                      className="sr-only"
                    />
                    <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-extrabold text-xs flex items-center justify-center">
                      O
                    </div>
                    <strong className="text-xs text-slate-900 dark:text-white">Orange Money</strong>
                    <small className="text-[10px] text-slate-500 dark:text-slate-400">Orange</small>
                  </label>

                  {/* AIRTEL MONEY */}
                  <label
                    className={`rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center gap-1 border-2 ${
                      moyenPaiement === 'AIRTEL_MONEY'
                        ? 'border-red-500 bg-red-50/70 dark:bg-red-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="moyen_paiement"
                      value="AIRTEL_MONEY"
                      checked={moyenPaiement === 'AIRTEL_MONEY'}
                      onChange={() => setMoyenPaiement('AIRTEL_MONEY')}
                      className="sr-only"
                    />
                    <div className="w-7 h-7 rounded-full bg-red-500 text-white font-extrabold text-xs flex items-center justify-center">
                      A
                    </div>
                    <strong className="text-xs text-slate-900 dark:text-white">Airtel Money</strong>
                    <small className="text-[10px] text-slate-500 dark:text-slate-400">Airtel</small>
                  </label>
                </div>
              </div>

              {/* Champ Téléphone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('locataire_pages.paiements.phone_label', 'Numéro de téléphone')} {moyenPaiement === 'MVOLA' ? 'Telma' : moyenPaiement === 'ORANGE_MONEY' ? 'Orange' : 'Airtel'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('locataire_pages.paiements.phone_placeholder', 'Ex : 034 00 000 00')}
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Champ Référence de transaction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('locataire_pages.paiements.ref_label', 'Référence ou ID de transaction Mobile Money')} <span className="text-slate-400 font-normal">(recommandé)</span>
                </label>
                <input
                  type="text"
                  placeholder={t('locataire_pages.paiements.ref_placeholder', 'Ex : MV-12345678 ou code SMS de confirmation')}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm transition-colors cursor-pointer"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedFacture}
                  className="flex-[2] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {loading ? t('forms.saving', 'Traitement en cours...') : t('locataire_pages.paiements.submit_btn', 'Envoyer la demande de paiement')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
