'use client'

import { useState } from 'react'
import { X, CheckCircle2, XCircle, Smartphone, AlertCircle, Loader2 } from 'lucide-react'
import {
  Paiement,
  validerDemandePaiement,
  refuserDemandePaiement,
  validerPaiement,
  refuserPaiement,
} from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { getOperatorBadgeStyles, getMobileMoneyOperator } from '@/lib/mobile-money'

interface ValidationDemandeModalProps {
  paiement: Paiement | null
  isOpen: boolean
  initialAction?: 'valider' | 'refuser'
  onClose: () => void
  onSuccess: () => void
}

export function ValidationDemandeModal({
  paiement,
  isOpen,
  initialAction = 'valider',
  onClose,
  onSuccess,
}: ValidationDemandeModalProps) {
  const { t } = useTranslation()
  const [action, setAction] = useState<'valider' | 'refuser'>(initialAction)
  const [motifRefus, setMotifRefus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !paiement) return null

  const demande = paiement.demande_en_cours
  const rawMode = demande?.moyen_paiement || paiement.mode_paiement || 'MVOLA'
  const mode = getMobileMoneyOperator(rawMode) || rawMode
  const telephone =
    demande?.telephone ||
    (paiement as any).telephone ||
    (paiement as any).locataire_telephone ||
    'Non renseigné'
  const reference =
    demande?.reference ||
    paiement.reference ||
    'Non renseignée'

  const montant = parseFloat(
    paiement.montant_paye && parseFloat(paiement.montant_paye) > 0
      ? paiement.montant_paye
      : (paiement.montant_attendu || paiement.montant || '0')
  )

  const opStyles = getOperatorBadgeStyles(mode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (action === 'valider') {
        if (demande?.id) {
          try {
            await validerDemandePaiement(demande.id)
          } catch {
            await validerPaiement(
              paiement.id,
              mode,
              reference !== 'Non renseignée' ? reference : undefined
            )
          }
        } else {
          await validerPaiement(
            paiement.id,
            mode,
            reference !== 'Non renseignée' ? reference : undefined
          )
        }
      } else {
        if (!motifRefus.trim()) {
          setError(
            t(
              'admin.paiements.error_motif_required',
              'Veuillez préciser le motif du refus (ex: référence invalide, paiement non reçu).'
            )
          )
          setLoading(false)
          return
        }
        if (demande?.id) {
          try {
            await refuserDemandePaiement(demande.id, motifRefus.trim())
          } catch {
            await refuserPaiement(paiement.id)
          }
        } else {
          await refuserPaiement(paiement.id)
        }
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Une erreur est survenue lors du traitement de la demande.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" style={{ zIndex: 1100 }}>
      <section
        className="modal bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl w-[90vw] max-w-[540px] relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          className="modal-close text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
          onClick={onClose}
          disabled={loading}
          aria-label={t('common.close', 'Fermer')}
          style={{ top: '16px', right: '16px', position: 'absolute' }}
        >
          <X size={20} />
        </button>

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              action === 'valider'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
            }`}
          >
            {action === 'valider' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">
              {action === 'valider'
                ? t('admin.paiements.valider_mobile_title', 'Valider le paiement Mobile Money')
                : t('admin.paiements.refuser_mobile_title', 'Refuser la demande de paiement')}
            </h2>
            <p className="m-0 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Échéance #{paiement.id} • {paiement.message_mois || t('common.monthly_invoice', 'Facture mensuelle')}
            </p>
          </div>
        </div>

        {/* Bascule action Valider / Refuser */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-4 gap-1">
          <button
            type="button"
            onClick={() => {
              setAction('valider')
              setError(null)
            }}
            disabled={loading}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all ${
              action === 'valider'
                ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t('admin.paiements.btn_valider_paiement', '✓ Valider le paiement')}
          </button>
          <button
            type="button"
            onClick={() => {
              setAction('refuser')
              setError(null)
            }}
            disabled={loading}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all ${
              action === 'refuser'
                ? 'bg-white text-rose-600 shadow-sm dark:bg-slate-900 dark:text-rose-400'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t('admin.paiements.btn_refuser_demande', '✕ Refuser la demande')}
          </button>
        </div>

        {/* Détails de la transaction */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                {t('admin.paiements.col_tenant', 'Locataire')}
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {paiement.locataire_nom || 'Non renseigné'}
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                {t('admin.paiements.col_property', 'Bien')}
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {paiement.bien_titre || 'Non renseigné'}
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                {t('admin.paiements.montant_a_valider', 'Montant à valider')}
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                {montant.toLocaleString('fr-FR')} Ar
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                {t('admin.paiements.col_mode', 'Opérateur')}
              </span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${opStyles.containerClass}`}
                >
                  <Smartphone size={11} className={opStyles.iconColorClass} />
                  {opStyles.label}
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                {t('admin.paiements.num_mobile_money', 'Numéro Mobile Money')}
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                {telephone}
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                {t('admin.paiements.ref_transaction', 'Référence transaction')}
              </span>
              <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 break-all">
                {reference}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {action === 'valider' ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-3 text-emerald-800 dark:text-emerald-300 text-xs mb-4 leading-relaxed">
              <strong>Impact de la validation :</strong>{' '}
              {t(
                'admin.paiements.validation_impact',
                'La facture sera marquée comme PAYÉE, la quittance officielle en PDF sera immédiatement générée, et le locataire sera notifié.'
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('admin.paiements.motif_refus_label', 'Motif du refus')}{' '}
                <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder={t(
                  'admin.paiements.motif_refus_placeholder',
                  'Ex : Référence transaction introuvable, montant reçu incomplet sur le compte MVola...'
                )}
                rows={3}
                required
                disabled={loading}
                className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {t(
                  'admin.paiements.refus_subtext',
                  'Le locataire sera informé du motif et pourra renouveler sa demande.'
                )}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              {t('common.cancel', 'Annuler')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-xs font-semibold rounded-lg text-white border-0 cursor-pointer inline-flex items-center gap-1.5 transition-colors ${
                action === 'valider'
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {action === 'valider'
                ? t('admin.paiements.confirm_valider', 'Confirmer la validation')
                : t('admin.paiements.confirm_refuser', 'Confirmer le refus')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
