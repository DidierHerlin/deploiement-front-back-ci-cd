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
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#fef3c7',
              color: '#b45309',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <Clock size={13} /> {t('locataire_pages.paiements.status_pending', 'En attente de validation')}
          </span>
        )
      case 'VALIDE':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle size={13} /> {t('locataire_pages.paiements.status_validated', 'Validée')}
          </span>
        )
      case 'REFUSE':
        return (
          <span
            title={motif || undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <XCircle size={13} /> {t('locataire_pages.paiements.status_rejected', 'Refusée')} {motif ? `(${motif})` : ''}
          </span>
        )
      case 'ANNULE':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
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
    <section className="panel" style={{ marginTop: '1.5rem' }}>
      <div className="panel-header">
        <div>
          <h2>{t('locataire_pages.paiements.pending_requests_title', 'Mes demandes de paiement Mobile Money')}</h2>
          <p>{t('locataire_pages.paiements.header_subtitle', "Consultez l'historique et l'état d'avancement de vos demandes de règlement")}</p>
        </div>
      </div>

      {error && (
        <div
          style={{
            margin: '1rem',
            padding: '12px',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            borderRadius: '8px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
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
              <tr>
                <th>{t('admin.reporting.col_echeance', 'DATE DE DEMANDE')}</th>
                <th>{t('admin.paiements.col_property', 'BIEN & FACTURE')}</th>
                <th>{t('admin.paiements.col_mode', 'OPÉRATEUR')}</th>
                <th>{t('admin.paiements.num_mobile_money', 'TÉLÉPHONE / RÉFÉRENCE')}</th>
                <th>{t('admin.paiements.col_amount', 'MONTANT')}</th>
                <th>{t('admin.paiements.col_status', 'STATUT')}</th>
                <th>{t('admin.paiements.col_actions', 'ACTION')}</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>
                      {new Date(d.date_demande).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </strong>
                    <br />
                    <small style={{ color: '#94a3b8' }}>
                      {new Date(d.date_demande).toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </td>
                  <td>
                    <strong>{d.bien_titre}</strong>
                    <br />
                    <small style={{ color: '#64748b' }}>
                      {d.mois_echeance_facture || 'Échéance à venir'}
                    </small>
                  </td>
                  <td>{getProviderBadge(d.moyen_paiement)}</td>
                  <td>
                    <div>{d.telephone || '-'}</div>
                    {d.reference && (
                      <small style={{ color: '#64748b', fontFamily: 'monospace' }}>
                        Réf: {d.reference}
                      </small>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: '#0f172a' }}>
                      {parseFloat(d.montant).toLocaleString('fr-FR')} Ar
                    </strong>
                  </td>
                  <td>{getStatusBadge(d.statut, d.motif_refus)}</td>
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
