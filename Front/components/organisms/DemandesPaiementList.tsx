'use client'

import React, { useState } from 'react'
import {
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  AlertCircle,
} from 'lucide-react'
import { DemandePaiement, annulerDemandePaiement } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

interface DemandesPaiementListProps {
  demandes: DemandePaiement[]
  onDemandeCancelled?: (updated: DemandePaiement) => void
}

export function DemandesPaiementList({
  demandes,
  onDemandeCancelled,
}: DemandesPaiementListProps) {
  const { t, lang } = useTranslation()
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnnuler = async (demandeId: number) => {
    if (!confirm(t('locataire_pages.paiements.cancel_confirm', 'Êtes-vous sûr de vouloir annuler cette demande de paiement ?'))) {
      return
    }

    setCancellingId(demandeId)
    setError(null)
    try {
      const res = await annulerDemandePaiement(demandeId)
      if (onDemandeCancelled) {
        onDemandeCancelled(res)
      }
    } catch (err: any) {
      setError(err.message || t('common.error_occurred', "Erreur lors de l'annulation de la demande."))
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusBadge = (statut: string, motif?: string | null) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
            <Clock size={13} /> {t('locataire_pages.paiements.status_pending', 'En attente de validation')}
          </span>
        )
      case 'VALIDE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
            <CheckCircle size={13} /> {t('locataire_pages.paiements.status_validated', 'Validée')}
          </span>
        )
      case 'REFUSE':
        return (
          <span
            title={motif || undefined}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap"
          >
            <XCircle size={13} /> {t('locataire_pages.paiements.status_rejected', 'Refusée')} {motif ? `(${motif})` : ''}
          </span>
        )
      case 'ANNULE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
            <Ban size={13} /> {t('locataire_pages.paiements.status_cancelled', 'Annulée')}
          </span>
        )
      default:
        return <span>{statut}</span>
    }
  }

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'MVOLA':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#047857',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            Mvola (Telma)
          </span>
        )
      case 'ORANGE_MONEY':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#ea580c',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#f97316',
              }}
            />
            Orange Money
          </span>
        )
      case 'AIRTEL_MONEY':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#dc2626',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
              }}
            />
            Airtel Money
          </span>
        )
      default:
        return <span>{provider}</span>
    }
  }

  return (
    <section className="panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm" style={{ marginTop: '1.5rem' }}>
      <div className="panel-header">
        <div>
          <h2 className="text-slate-900 dark:text-white font-bold text-base m-0">{t('locataire_pages.paiements.pending_requests_title', 'Mes demandes de paiement Mobile Money')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{t('locataire_pages.paiements.header_subtitle', "Consultez l'historique et l'état d'avancement de vos demandes de règlement")}</p>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {demandes.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
          <Smartphone size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
          <p style={{ margin: 0, fontWeight: 500 }}>
            {t('locataire_pages.paiements.empty_requests', 'Aucune demande de paiement enregistrée.')}
          </p>
          <small style={{ color: '#94a3b8' }}>
            {t('locataire_pages.paiements.empty_requests_hint', 'Lorsque vous demandez le paiement de votre facture du mois à venir, elle apparaîtra ici.')}
          </small>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t('admin.reporting.col_echeance', 'DATE DE DEMANDE')}</th>
                <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t('admin.paiements.col_property', 'BIEN & FACTURE')}</th>
                <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t('admin.paiements.col_mode', 'OPÉRATEUR')}</th>
                <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t('admin.paiements.num_mobile_money', 'TÉLÉPHONE / RÉFÉRENCE')}</th>
                <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t('admin.paiements.col_amount', 'MONTANT')}</th>
                <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t('admin.paiements.col_status', 'STATUT')}</th>
                <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t('admin.paiements.col_actions', 'ACTION')}</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <strong className="text-slate-900 dark:text-white font-medium text-xs sm:text-sm">
                      {new Date(d.date_demande).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </strong>
                    <br />
                    <small className="text-slate-400 dark:text-slate-500 text-[11px]">
                      {new Date(d.date_demande).toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </td>
                  <td className="py-3 px-3">
                    <strong className="text-slate-900 dark:text-white font-medium text-xs sm:text-sm">{d.bien_titre}</strong>
                    <br />
                    <small className="text-slate-500 dark:text-slate-400 text-xs">
                      {d.mois_echeance_facture || 'Échéance à venir'}
                    </small>
                  </td>
                  <td className="py-3 px-3">{getProviderBadge(d.moyen_paiement)}</td>
                  <td className="py-3 px-3">
                    <div className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{d.telephone || '-'}</div>
                    {d.reference && (
                      <small className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                        Réf: {d.reference}
                      </small>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <strong className="text-slate-900 dark:text-white text-xs sm:text-sm font-semibold">
                      {parseFloat(d.montant).toLocaleString('fr-FR')} Ar
                    </strong>
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(d.statut, d.motif_refus)}</td>
                  <td>
                    {d.statut === 'EN_ATTENTE' ? (
                      <button
                        onClick={() => handleAnnuler(d.id)}
                        disabled={cancellingId === d.id}
                        className="outline-button"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          color: '#dc2626',
                          borderColor: '#fca5a5',
                          cursor: cancellingId === d.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {cancellingId === d.id ? t('forms.loading', 'Annulation...') : t('common.cancel', 'Annuler')}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
