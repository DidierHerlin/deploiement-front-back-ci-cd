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
    <tr style={{ backgroundColor: isMobileMoneyPending ? '#f0fdf4' : undefined }}>
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
        {paiement.date_paiement && <div style={{ fontSize: '13px' }}><span style={{ color: '#10b981' }}>{t("admin.paiements.paid_prefix", "Payé:")}</span> {formatDate(paiement.date_paiement)}</div>}
      </td>
      <td>
        <PaiementStatusBadge statut={paiement.statut} contratStatut={contratStatut} />
      </td>
      <td>
        {isMobileMoneyPending ? (
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0'
              }}
            >
              <Smartphone size={11} /> {paiement.demande_en_cours?.moyen_paiement || paiement.mode_paiement || 'Mobile Money'}
            </span>
            {(paiement.demande_en_cours?.reference || paiement.reference) && (
              <small style={{ display: 'block', color: '#047857', fontFamily: 'monospace', marginTop: '2px' }}>
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
              className="action-icon"
              onClick={() => onValiderDemande(paiement)}
              title={t("admin.paiements.validate_hint", "Valider la demande Mobile Money")}
              style={{ color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0' }}
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          {isMobileMoneyPending && onRefuserDemande && (
            <button
              className="action-icon"
              onClick={() => onRefuserDemande(paiement)}
              title={t("admin.paiements.reject_hint", "Refuser la demande Mobile Money")}
              style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <XCircle size={16} />
            </button>
          )}
          {paiement.statut === 'PAYE' && (
            <button className="action-icon" onClick={() => downloadQuittance(paiement.id)} title={t("locataire_pages.quittances.download_btn", "Télécharger la quittance")} style={{ color: '#2563eb' }}>
              <Download size={16} />
            </button>
          )}
          {paiement.statut !== 'PAYE' && paiement.statut !== 'ANNULE' && paiement.statut !== 'RESILIE' && !isContratResilie && (
            <button className="action-icon" onClick={() => onEdit(paiement)} title={t("admin.paiements.modal_validate_title", "Enregistrer / Valider")}>
              <Edit size={16} />
            </button>
          )}
          <button className="action-icon" onClick={() => onView(paiement)} title={t("forms.view", "Détails")}>
            <Eye size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
