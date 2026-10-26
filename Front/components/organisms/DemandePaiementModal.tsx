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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Smartphone size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                {t('locataire_pages.paiements.modal_title', 'Demande de paiement Mobile Money')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                {t('locataire_pages.paiements.modal_subtitle', 'Règlement sécurisé de votre facture du mois à venir')}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            aria-label={t('common.close', 'Fermer')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {successDemande ? (
            /* Confirmation Step */
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                {t('locataire_pages.paiements.success_title', 'Demande transmise avec succès !')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                {t('locataire_pages.paiements.success_desc', 'Votre demande de paiement a bien été enregistrée dans la base de données. Elle est actuellement en attente de validation par le gestionnaire.')}
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Numéro de demande :</span>
                  <strong>#{successDemande.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Bien concerné :</span>
                  <strong>{successDemande.bien_titre}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Mois d'échéance :</span>
                  <strong>{successDemande.mois_echeance_facture}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Moyen de paiement :</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        successDemande.moyen_paiement === 'MVOLA'
                          ? '#059669'
                          : successDemande.moyen_paiement === 'ORANGE_MONEY'
                          ? '#ea580c'
                          : '#dc2626',
                    }}
                  >
                    {successDemande.moyen_paiement}
                  </span>
                </div>
                {successDemande.telephone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Téléphone :</span>
                    <strong>{successDemande.telephone}</strong>
                  </div>
                )}
                {successDemande.reference && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Référence transaction :</span>
                    <strong>{successDemande.reference}</strong>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px dashed #cbd5e1',
                  }}
                >
                  <span style={{ color: '#64748b' }}>Montant :</span>
                  <strong style={{ fontSize: '1.05rem', color: '#16a34a' }}>
                    {parseFloat(successDemande.montant).toLocaleString('fr-FR')} Ar
                  </strong>
                </div>
              </div>

              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '1.5rem',
                  fontSize: '0.82rem',
                  color: '#1e40af',
                  textAlign: 'left',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Note importante :</strong> Conformément aux règles de gestion, votre facture reste au statut "En attente" jusqu'à la validation définitive de la transaction par l'agence.
                </span>
              </div>

              <button
                onClick={handleResetAndClose}
                style={{
                  width: '100%',
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                {t('common.close', 'Fermer')}
              </button>
            </div>
          ) : (
            /* Form Step */
            <form onSubmit={handleSubmit}>
              {/* Règle métier explicite */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  gap: '10px',
                  fontSize: '0.82rem',
                  color: '#166534',
                }}
              >
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Règle de facturation :</strong> Le règlement des factures s'effectue dans l'<strong>ordre chronologique</strong>. La facture impayée la plus ancienne doit être réglée en priorité. Modes acceptés : exclusivement Mobile Money.
                </div>
              </div>

              {/* Sélection / Résumé de la Facture */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  {t('locataire_pages.paiements.select_invoice', 'Facture mensuelle à régler')}
                </label>
                {facturesEligibles.length > 1 ? (
                  <select
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: '#f8fafc',
                    }}
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
                  <div
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                        {selectedFacture.bien_titre}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                          fontWeight: 600,
                        }}
                      >
                        Échéance prioritaire autorisée
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                      <span>
                        Échéance : <strong>{selectedFacture.date_echeance ? new Date(selectedFacture.date_echeance).toLocaleDateString('fr-FR') : '-'}</strong>
                      </span>
                      <span>
                        Période : <strong>{selectedFacture.message_mois || 'Mois à venir'}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px', backgroundColor: '#fff1f2', color: '#be123c', borderRadius: '8px', fontSize: '0.85rem' }}>
                    Aucune facture éligible pour le mois à venir n'a été trouvée.
                  </div>
                )}
              </div>

              {/* Montant réel à payer */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                  border: '1px solid #c7d2fe',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#4338ca', fontWeight: 600, textTransform: 'uppercase' }}>
                    Montant exact de la facture
                  </span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6366f1' }}>
                    Conforme au loyer contractuel
                  </p>
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#3730a3' }}>
                  {montantFormatted} Ar
                </div>
              </div>

              {/* Sélection Opérateur Mobile Money (EXCLUSIVEMENT) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  {t('locataire_pages.paiements.select_operator', 'Moyen de paiement (Exclusivement Mobile Money)')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {/* MVOLA */}
                  <label
                    style={{
                      border: `2px solid ${moyenPaiement === 'MVOLA' ? '#10b981' : '#e2e8f0'}`,
                      backgroundColor: moyenPaiement === 'MVOLA' ? '#f0fdf4' : 'white',
                      borderRadius: '10px',
                      padding: '12px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <input
                      type="radio"
                      name="moyen_paiement"
                      value="MVOLA"
                      checked={moyenPaiement === 'MVOLA'}
                      onChange={() => setMoyenPaiement('MVOLA')}
                      style={{ position: 'absolute', opacity: 0 }}
                    />
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      M
                    </div>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Mvola</strong>
                    <small style={{ fontSize: '0.7rem', color: '#64748b' }}>Telma</small>
                  </label>

                  {/* ORANGE MONEY */}
                  <label
                    style={{
                      border: `2px solid ${moyenPaiement === 'ORANGE_MONEY' ? '#f97316' : '#e2e8f0'}`,
                      backgroundColor: moyenPaiement === 'ORANGE_MONEY' ? '#fff7ed' : 'white',
                      borderRadius: '10px',
                      padding: '12px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <input
                      type="radio"
                      name="moyen_paiement"
                      value="ORANGE_MONEY"
                      checked={moyenPaiement === 'ORANGE_MONEY'}
                      onChange={() => setMoyenPaiement('ORANGE_MONEY')}
                      style={{ position: 'absolute', opacity: 0 }}
                    />
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: '#f97316',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      O
                    </div>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Orange Money</strong>
                    <small style={{ fontSize: '0.7rem', color: '#64748b' }}>Orange</small>
                  </label>

                  {/* AIRTEL MONEY */}
                  <label
                    style={{
                      border: `2px solid ${moyenPaiement === 'AIRTEL_MONEY' ? '#ef4444' : '#e2e8f0'}`,
                      backgroundColor: moyenPaiement === 'AIRTEL_MONEY' ? '#fef2f2' : 'white',
                      borderRadius: '10px',
                      padding: '12px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <input
                      type="radio"
                      name="moyen_paiement"
                      value="AIRTEL_MONEY"
                      checked={moyenPaiement === 'AIRTEL_MONEY'}
                      onChange={() => setMoyenPaiement('AIRTEL_MONEY')}
                      style={{ position: 'absolute', opacity: 0 }}
                    />
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      A
                    </div>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Airtel Money</strong>
                    <small style={{ fontSize: '0.7rem', color: '#64748b' }}>Airtel</small>
                  </label>
                </div>
              </div>

              {/* Champ Téléphone */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  {t('locataire_pages.paiements.phone_label', 'Numéro de téléphone')} {moyenPaiement === 'MVOLA' ? 'Telma' : moyenPaiement === 'ORANGE_MONEY' ? 'Orange' : 'Airtel'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('locataire_pages.paiements.phone_placeholder', 'Ex : 034 00 000 00')}
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Champ Référence de transaction */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  {t('locataire_pages.paiements.ref_label', 'Référence ou ID de transaction Mobile Money')} <span style={{ color: '#94a3b8', fontWeight: 400 }}>(recommandé)</span>
                </label>
                <input
                  type="text"
                  placeholder={t('locataire_pages.paiements.ref_placeholder', 'Ex : MV-12345678 ou code SMS de confirmation')}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Bouton de validation */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedFacture}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: loading || !selectedFacture ? '#94a3b8' : '#4f46e5',
                    color: 'white',
                    fontWeight: 700,
                    cursor: loading || !selectedFacture ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.25)',
                  }}
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
