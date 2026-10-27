import { Eye, Edit, Download, Smartphone, CheckCircle2, XCircle } from 'lucide-react'
import { Paiement, Contrat, downloadQuittance } from '@/lib/api'
import { PaiementStatusBadge } from "@/components/atoms/paiement_PaiementStatusBadge"
import { useTranslation } from '@/lib/i18n'

type PaiementTableRowProps = {
  paiement: Paiement
  contrats?: Contrat[]
  onView: (p: Paiement) => void
  onEdit: (p: Paiement) => void
  onValiderDemande?: (p: Paiement) => void
  onRefuserDemande?: (p: Paiement) => void
}

export function PaiementTableRow({ paiement, contrats, onView, onEdit, onValiderDemande, onRefuserDemande }: PaiementTableRowProps) {
  const { t } = useTranslation()

  const formatDate = (d: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  const formatMontant = (m: string | null) => {
    if (!m) return '-'
    return Number(m).toLocaleString('fr-FR') + ' Ar'
  }

  const isMobileMoneyPending = paiement.statut === 'EN_ATTENTE' && 
    (['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY'].includes(paiement.mode_paiement || '') || !!paiement.demande_en_cours)

  const directContratStatut = (paiement as any).contrat_statut
  const nestedContratStatut = typeof paiement.contrat === 'object' && paiement.contrat !== null
    ? (paiement.contrat as any).statut
    : undefined
  const listContratStatut = contrats && typeof paiement.contrat === 'number'
    ? contrats.find(c => c.id === paiement.contrat)?.statut
    : undefined
  const contratStatut = directContratStatut || nestedContratStatut || listContratStatut
  const isContratResilie = Boolean(contratStatut && ['RESILIE', 'RÉSILIÉ'].includes(contratStatut.trim().toUpperCase()))

  return (
    <tr className={isMobileMoneyPending ? 'bg-emerald-50/70 dark:bg-emerald-950/20' : undefined}>
      <td>
        <div style={{ fontWeight: 500 }}>#{paiement.id}</div>
        <small style={{ color: '#64748b' }}>{t("admin.paiements.due_num", "Éch.")} {paiement.num_echeance || '-'}</small>
      </td>
      <td>{paiement.bien_titre}</td>
      <td>{paiement.locataire_nom}</td>
      <td>
        <div style={{ fontWeight: 600 }}>{formatMontant(paiement.montant_paye && parseFloat(paiement.montant_paye) > 0 ? paiement.montant_paye : paiement.montant_attendu)}</div>
        {paiement.est_partiel && <small style={{ color: '#dc2626' }}>{t("admin.paiements.remaining", "Reste :")} {formatMontant(paiement.montant_restant)}</small>}
      </td>
      <td>
        <div style={{ fontSize: '13px' }}><span style={{ color: '#64748b' }}>{t("admin.paiements.due_prefix", "Éch:")}</span> {formatDate(paiement.date_echeance)}</div>
        {paiement.date_paiement && <div style={{ fontSize: '13px' }}><span className="text-emerald-600 dark:text-emerald-400">{t("admin.paiements.paid_prefix", "Payé:")}</span> {formatDate(paiement.date_paiement)}</div>}
      </td>
      <td>
        <PaiementStatusBadge statut={paiement.statut} contratStatut={contratStatut} />
      </td>
      <td>
        {isMobileMoneyPending ? (
          <div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
              <Smartphone size={11} /> {paiement.demande_en_cours?.moyen_paiement || paiement.mode_paiement || 'Mobile Money'}
            </span>
            {(paiement.demande_en_cours?.reference || paiement.reference) && (
              <small className="block text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 text-xs">
                {t("admin.paiements.ref_prefix", "Réf:")} {paiement.demande_en_cours?.reference || paiement.reference}
              </small>
            )}
          </div>
        ) : (
          paiement.mode_paiement || '-'
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
          {isMobileMoneyPending && onValiderDemande && (
            <button
              className="action-icon text-emerald-600 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 p-1.5 rounded-md"
              onClick={() => onValiderDemande(paiement)}
              title={t("admin.paiements.validate_hint", "Valider la demande Mobile Money")}
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          {isMobileMoneyPending && onRefuserDemande && (
            <button
              className="action-icon text-rose-600 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 p-1.5 rounded-md"
              onClick={() => onRefuserDemande(paiement)}
              title={t("admin.paiements.reject_hint", "Refuser la demande Mobile Money")}
            >
              <XCircle size={16} />
            </button>
          )}
          {paiement.statut === 'PAYE' && (
            <button className="action-icon text-blue-600 dark:text-blue-400 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={() => downloadQuittance(paiement.id)} title={t("locataire_pages.quittances.download_btn", "Télécharger la quittance")}>
              <Download size={16} />
            </button>
          )}
          {paiement.statut !== 'PAYE' && paiement.statut !== 'ANNULE' && paiement.statut !== 'RESILIE' && !isContratResilie && (
            <button className="action-icon p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" onClick={() => onEdit(paiement)} title={t("admin.paiements.modal_validate_title", "Enregistrer / Valider")}>
              <Edit size={16} />
            </button>
          )}
          <button className="action-icon p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" onClick={() => onView(paiement)} title={t("forms.view", "Détails")}>
            <Eye size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
