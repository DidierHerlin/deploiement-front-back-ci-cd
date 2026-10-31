import { Eye, Edit, Download, Smartphone, CheckCircle2, XCircle } from 'lucide-react'
import { Paiement, Contrat, downloadQuittance } from '@/lib/api'
import { PaiementStatusBadge } from "@/components/atoms/paiement_PaiementStatusBadge"
import { useTranslation } from '@/lib/i18n'
import {
  isMobileMoneyPending,
  isMobileMoneyMode,
  getOperatorBadgeStyles,
  getModeDisplayLabel,
} from '@/lib/mobile-money'

type PaiementTableRowProps = {
  paiement: Paiement
  contrats?: Contrat[]
  onView: (p: Paiement) => void
  onEdit: (p: Paiement) => void
  onValiderDemande?: (p: Paiement) => void
  onRefuserDemande?: (p: Paiement) => void
}

export function PaiementTableRow({
  paiement,
  contrats,
  onView,
  onEdit,
  onValiderDemande,
  onRefuserDemande,
}: PaiementTableRowProps) {
  const { t } = useTranslation()

  const formatDate = (d: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  const formatMontant = (m: string | null) => {
    if (!m) return '-'
    return Number(m).toLocaleString('fr-FR') + ' Ar'
  }

  const directContratStatut = (paiement as any).contrat_statut
  const nestedContratStatut =
    typeof paiement.contrat === 'object' && paiement.contrat !== null
      ? (paiement.contrat as any).statut
      : undefined
  const listContratStatut =
    contrats && typeof paiement.contrat === 'number'
      ? contrats.find((c) => c.id === paiement.contrat)?.statut
      : undefined
  const contratStatut = directContratStatut || nestedContratStatut || listContratStatut
  const isContratResilie = Boolean(
    contratStatut && ['RESILIE', 'RÉSILIÉ'].includes(contratStatut.trim().toUpperCase())
  )

  const isPending = isMobileMoneyPending(paiement, () => isContratResilie)

  const effectiveMode =
    paiement.demande_en_cours?.moyen_paiement || paiement.mode_paiement || null
  const effectiveRef =
    paiement.demande_en_cours?.reference || paiement.reference || null
  const effectiveTel =
    paiement.demande_en_cours?.telephone ||
    (paiement as any).telephone ||
    (paiement as any).locataire_telephone ||
    null

  const isMM = isMobileMoneyMode(effectiveMode)
  const operatorStyles = getOperatorBadgeStyles(effectiveMode)

  return (
    <tr
      className={
        isPending
          ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 transition-colors'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors'
      }
    >
      <td>
        <div style={{ fontWeight: 500 }}>#{paiement.id}</div>
        <small style={{ color: '#64748b' }}>
          {t('admin.paiements.due_num', 'Éch.')} {paiement.num_echeance || '-'}
        </small>
      </td>
      <td>{paiement.bien_titre}</td>
      <td>{paiement.locataire_nom}</td>
      <td>
        <div style={{ fontWeight: 600 }}>
          {formatMontant(
            paiement.montant_paye && parseFloat(paiement.montant_paye) > 0
              ? paiement.montant_paye
              : paiement.montant_attendu
          )}
        </div>
        {paiement.est_partiel && (
          <small style={{ color: '#dc2626' }}>
            {t('admin.paiements.remaining', 'Reste :')} {formatMontant(paiement.montant_restant)}
          </small>
        )}
      </td>
      <td>
        <div style={{ fontSize: '13px' }}>
          <span style={{ color: '#64748b' }}>{t('admin.paiements.due_prefix', 'Éch:')}</span>{' '}
          {formatDate(paiement.date_echeance)}
        </div>
        {paiement.date_paiement && (
          <div style={{ fontSize: '13px' }}>
            <span className="text-emerald-600 dark:text-emerald-400">
              {t('admin.paiements.paid_prefix', 'Payé:')}
            </span>{' '}
            {formatDate(paiement.date_paiement)}
          </div>
        )}
      </td>
      <td>
        <PaiementStatusBadge
          statut={paiement.statut}
          contratStatut={contratStatut}
          isMobileMoneyPending={isPending}
        />
      </td>
      <td>
        {isMM ? (
          <div className="flex flex-col gap-0.5 items-start">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${operatorStyles.containerClass}`}
            >
              <Smartphone size={12} className={operatorStyles.iconColorClass} />
              {operatorStyles.label}
            </span>
            {effectiveRef && (
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                <span className="text-slate-400 font-sans">{t('admin.paiements.ref_prefix', 'Réf:')} </span>
                {effectiveRef}
              </span>
            )}
            {effectiveTel && (
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <span className="text-slate-400 font-sans">{t('profile.phone', 'Tél:')} </span>
                {effectiveTel}
              </span>
            )}
          </div>
        ) : effectiveMode ? (
          <div>
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
              {getModeDisplayLabel(effectiveMode)}
            </span>
            {effectiveRef && (
              <small className="block text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                {t('admin.paiements.ref_prefix', 'Réf:')} {effectiveRef}
              </small>
            )}
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
          {isPending && onValiderDemande && (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white transition-colors cursor-pointer border border-emerald-600"
              onClick={() => onValiderDemande(paiement)}
              title={t('admin.paiements.validate_hint', 'Valider la demande Mobile Money')}
            >
              <CheckCircle2 size={13} />
              <span>{t('admin.paiements.action_valider', 'Valider')}</span>
            </button>
          )}
          {isPending && onRefuserDemande && (
            <button
              type="button"
              className="action-icon text-rose-600 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 p-1.5 rounded-md cursor-pointer transition-colors"
              onClick={() => onRefuserDemande(paiement)}
              title={t('admin.paiements.reject_hint', 'Refuser la demande Mobile Money')}
            >
              <XCircle size={15} />
            </button>
          )}
          {paiement.statut === 'PAYE' && (
            <button
              className="action-icon text-blue-600 dark:text-blue-400 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30"
              onClick={() => downloadQuittance(paiement.id)}
              title={t('locataire_pages.quittances.download_btn', 'Télécharger la quittance')}
            >
              <Download size={16} />
            </button>
          )}
          {paiement.statut !== 'PAYE' &&
            paiement.statut !== 'ANNULE' &&
            paiement.statut !== 'RESILIE' &&
            !isContratResilie &&
            !isPending && (
              <button
                className="action-icon p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                onClick={() => onEdit(paiement)}
                title={t('admin.paiements.modal_validate_title', 'Enregistrer / Valider')}
              >
                <Edit size={16} />
              </button>
            )}
          <button
            className="action-icon p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            onClick={() => onView(paiement)}
            title={t('forms.view', 'Détails')}
          >
            <Eye size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
