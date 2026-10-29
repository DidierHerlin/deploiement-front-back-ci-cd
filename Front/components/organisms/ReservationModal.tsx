'use client'

import { useState } from 'react'
import { X, Check, MapPin, Tag } from 'lucide-react'
import { BienListItem, creerReservation } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

interface ReservationModalProps {
  bien: BienListItem
  onClose: () => void
  onSuccess: () => void
}

export default function ReservationModal({ bien, onClose, onSuccess }: ReservationModalProps) {
  const { t } = useTranslation()
  const typeReservation = bien.mode_transaction === 'VENTE' ? 'ACHAT' : 'LOCATION'
  const [commentaire, setCommentaire] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await creerReservation({
        bien: bien.id,
        commentaire,
        type_reservation: typeReservation,
      })
      onSuccess()
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création de la réservation.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              {t('locataire_pages.biens.reserve_kicker', 'RÉSERVATION')}
            </p>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold">
              {t('locataire_pages.biens.reserve_title', 'Réserver ce bien')}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            aria-label={t('common.close', 'Fermer')} 
            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Résumé du bien */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl p-4 mb-5">
          <h3 className="text-slate-900 dark:text-slate-100 font-semibold text-sm mb-2">{bien.titre}</h3>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {bien.adresse}</span>
            <span className="flex items-center gap-1.5"><Tag size={14} className="text-slate-400" /> {bien.type}</span>
          </div>
          <div className="mt-2.5 text-base font-bold text-blue-600 dark:text-blue-400">
            {bien.mode_transaction === 'LOCATION'
              ? `${Number(bien.loyer_mensuel || 0).toLocaleString()} Ar / ${t('card.per_month', 'mois')}`
              : `${Number(bien.prix || 0).toLocaleString()} Ar`
            }
          </div>
        </div>

        {/* Type de réservation */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            {t('locataire_pages.biens.reserve_type_label', 'Type de réservation')}
          </label>
          <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm">
            {typeReservation === 'LOCATION'
              ? t('locataire_pages.biens.type_location', 'Location')
              : t('locataire_pages.biens.type_achat', 'Achat')}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('locataire_pages.biens.type_desc', 'Déterminé automatiquement selon le mode de transaction du bien.')}
          </p>
        </div>

        {/* Commentaire */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            {t('locataire_pages.biens.comment_label', 'Commentaire (optionnel)')}
          </label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder={t('locataire_pages.biens.comment_placeholder', 'Décrivez vos besoins, posez vos questions...')}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg mb-4 text-xs">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors cursor-pointer"
          >
            {t('common.cancel', 'Annuler')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            {submitting ? t('locataire_pages.biens.sending', 'Envoi...') : t('locataire_pages.biens.confirm_btn', 'Confirmer la réservation')}
          </button>
        </div>
      </div>
    </div>
  )
}
