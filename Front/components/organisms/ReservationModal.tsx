'use client'

import { useState } from 'react'
import { X, Check, MapPin, Maximize, DoorOpen, Tag } from 'lucide-react'
import { BienListItem, creerReservation } from '@/lib/api'

interface ReservationModalProps {
  bien: BienListItem
  onClose: () => void
  onSuccess: () => void
}

export default function ReservationModal({ bien, onClose, onSuccess }: ReservationModalProps) {
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
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="panel" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p className="section-kicker">RÉSERVATION</p>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Réserver ce bien</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Résumé du bien */}
        <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{bien.titre}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--muted-foreground)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {bien.adresse}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={14} /> {bien.type}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
            {bien.mode_transaction === 'LOCATION'
              ? `${Number(bien.loyer_mensuel || 0).toLocaleString()} Ar / mois`
              : `${Number(bien.prix || 0).toLocaleString()} Ar`
            }
          </div>
        </div>

        {/* Type de réservation */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Type de réservation</label>
          <div style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 13, color: 'var(--muted-foreground)' }}>
            {typeReservation === 'LOCATION' ? '📋 Location' : '🏠 Achat'}
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Déterminé automatiquement selon le mode de transaction du bien.
          </p>
        </div>

        {/* Commentaire */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Commentaire (optionnel)</label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Décrivez vos besoins, posez vos questions..."
            rows={4}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', resize: 'vertical', fontSize: 13 }}
          />
        </div>

        {error && (
          <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 6, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            <Check size={16} />
            {submitting ? 'Envoi...' : 'Confirmer la réservation'}
          </button>
        </div>
      </div>
    </div>
  )
}
