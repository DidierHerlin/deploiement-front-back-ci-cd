'use client'

import { useState } from 'react'
import { X, CheckCircle2, XCircle, Smartphone, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { Paiement, validerDemandePaiement, refuserDemandePaiement, validerPaiement, refuserPaiement } from '@/lib/api'

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
  const [action, setAction] = useState<'valider' | 'refuser'>(initialAction)
  const [motifRefus, setMotifRefus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !paiement) return null

  const demande = paiement.demande_en_cours
  const mode = paiement.mode_paiement || demande?.moyen_paiement || 'MVOLA'
  const telephone = demande?.telephone || 'Non renseigné'
  const reference = paiement.reference || demande?.reference || 'Non renseignée'
  const montant = parseFloat(
    paiement.montant_paye && parseFloat(paiement.montant_paye) > 0
      ? paiement.montant_paye
      : (paiement.montant_attendu || paiement.montant || '0')
  )

  const getOperatorBadge = (op: string) => {
    switch (op) {
      case 'MVOLA':
        return { label: 'MVola (Telma)', bg: '#fef08a', color: '#854d0e', border: '#facc15' }
      case 'ORANGE_MONEY':
        return { label: 'Orange Money', bg: '#ffedd5', color: '#c2410c', border: '#fdba74' }
      case 'AIRTEL_MONEY':
        return { label: 'Airtel Money', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' }
      default:
        return { label: op, bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' }
    }
  }

  const opBadge = getOperatorBadge(mode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (action === 'valider') {
        if (demande?.id) {
          await validerDemandePaiement(demande.id)
        } else {
          await validerPaiement(paiement.id, mode, reference !== 'Non renseignée' ? reference : undefined)
        }
      } else {
        if (!motifRefus.trim()) {
          setError('Veuillez préciser le motif du refus (ex: référence invalide, paiement non reçu).')
          setLoading(false)
          return
        }
        if (demande?.id) {
          await refuserDemandePaiement(demande.id, motifRefus.trim())
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
        className="modal"
        role="dialog"
        aria-modal="true"
        style={{
          width: '90vw',
          maxWidth: '540px',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Fermer"
          style={{ top: '16px', right: '16px' }}
        >
          <X size={20} />
        </button>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: action === 'valider' ? '#ecfdf5' : '#fef2f2',
              color: action === 'valider' ? '#059669' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {action === 'valider' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              {action === 'valider' ? 'Valider le paiement Mobile Money' : 'Refuser la demande de paiement'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
              Échéance #{paiement.id} • {paiement.message_mois || 'Facture mensuelle'}
            </p>
          </div>
        </div>

        {/* Bascule action Valider / Refuser */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '8px',
            marginBottom: '18px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => { setAction('valider'); setError(null); }}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: action === 'valider' ? '#ffffff' : 'transparent',
              color: action === 'valider' ? '#059669' : '#64748b',
              boxShadow: action === 'valider' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            ✓ Valider le paiement
          </button>
          <button
            type="button"
            onClick={() => { setAction('refuser'); setError(null); }}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: action === 'refuser' ? '#ffffff' : 'transparent',
              color: action === 'refuser' ? '#dc2626' : '#64748b',
              boxShadow: action === 'refuser' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            ✕ Refuser la demande
          </button>
        </div>

        {/* Détails de la transaction */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Locataire</span>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{paiement.locataire_nom || 'Non renseigné'}</div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Bien</span>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{paiement.bien_titre || 'Non renseigné'}</div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Montant à valider</span>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                {montant.toLocaleString('fr-FR')} Ar
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Opérateur</span>
              <div style={{ marginTop: '2px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: opBadge.bg,
                    color: opBadge.color,
                    border: `1px solid ${opBadge.border}`,
                  }}
                >
                  <Smartphone size={11} /> {opBadge.label}
                </span>
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Numéro Mobile Money</span>
              <div style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>{telephone}</div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Référence transaction</span>
              <div style={{ fontWeight: 700, color: '#047857', fontFamily: 'monospace' }}>{reference}</div>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {action === 'valider' ? (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#166534',
                fontSize: '12px',
                marginBottom: '18px',
                lineHeight: '1.5',
              }}
            >
              <strong>Impact de la validation :</strong> La facture sera marquée comme <strong>PAYÉE</strong>, la quittance officielle en PDF sera immédiatement générée, et le locataire sera notifié.
            </div>
          ) : (
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Motif du refus <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Ex : Référence transaction introuvable, montant reçu incomplet sur le compte MVola..."
                rows={3}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Le locataire sera informé du motif et pourra renouveler sa demande.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="outline-button"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="primary-button"
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: action === 'valider' ? '#059669' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {action === 'valider' ? 'Confirmer la validation' : 'Confirmer le refus'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
