'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { Eye, Send, FileText, CalendarCheck, X, Search } from 'lucide-react'
import { getReservations, repondreReservation, ReservationData } from '@/lib/api'
import { useRouter } from 'next/navigation'

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    EN_ATTENTE: { bg: '#fef3c7', color: '#92400e', label: 'En attente' },
    TRAITEE: { bg: '#dcfce7', color: '#166534', label: 'Traitée' },
    ANNULEE: { bg: '#fef2f2', color: '#dc2626', label: 'Annulée' },
  }
  const c = config[statut] || config.EN_ATTENTE
  return <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>{c.label}</span>
}

function TypeBadge({ type }: { type: string }) {
  const isLocation = type === 'LOCATION'
  return <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: isLocation ? '#dbeafe' : '#fef3c7', color: isLocation ? '#1e40af' : '#92400e' }}>{isLocation ? 'Location' : 'Achat'}</span>
}

export default function AgentReservationsPage() {
  const router = useRouter()
  const [reservations, setReservations] = useState<ReservationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('Tous')
  const [selected, setSelected] = useState<ReservationData | null>(null)
  const [reponse, setReponse] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')

  const fetchData = () => {
    setLoading(true)
    getReservations()
      .then(setReservations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const filtered = reservations.filter((r) => {
    const matchSearch = `${r.locataire_nom || ''} ${r.locataire_prenoms || ''} ${r.bien_titre || ''}`.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filterStatut === 'Tous' || r.statut === filterStatut
    return matchSearch && matchStatut
  })

  const handleRepondre = async () => {
    if (!selected || !reponse.trim()) return
    setSending(true)
    try {
      await repondreReservation(selected.id, { reponse_admin: reponse, statut: 'TRAITEE' })
      setToast('Réponse envoyée au locataire.')
      setSelected(null)
      setReponse('')
      fetchData()
      setTimeout(() => setToast(''), 3000)
    } catch (e: any) {
      alert(e.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  const handleGerer = (r: ReservationData) => {
    const typeContrat = r.type_reservation
    router.push(`/agent/contrats/ajouter?bien=${r.bien}&locataire=${r.locataire}&type_contrat=${typeContrat}&reservation_id=${r.id}`)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p className="section-kicker">GESTION</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Réservations</h1>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
          Consultez et gérez les réservations soumises par les locataires.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13 }} />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13 }}>
          <option value="Tous">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="TRAITEE">Traitée</option>
          <option value="ANNULEE">Annulée</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}><p>Chargement...</p></div>
      ) : error ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}><p>{error}</p></div>
      ) : (
        <div className="panel" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>Locataire</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>Bien</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>Type</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>Statut</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>Aucune réservation trouvée.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}>{r.locataire_prenoms} {r.locataire_nom}</td>
                  <td style={{ padding: '10px 12px' }}>{r.bien_titre}</td>
                  <td style={{ padding: '10px 12px' }}><TypeBadge type={r.type_reservation} /></td>
                  <td style={{ padding: '10px 12px' }}><StatutBadge statut={r.statut} /></td>
                  <td style={{ padding: '10px 12px' }}>{new Date(r.date_creation).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button onClick={() => { setSelected(r); setReponse('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Voir le détail">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="panel" style={{ maxWidth: 640, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Détail de la réservation #{selected.id}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <TypeBadge type={selected.type_reservation} />
              <StatutBadge statut={selected.statut} />
            </div>

            {/* Locataire info */}
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>👤 Locataire</h4>
            <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <p><strong>{selected.locataire_prenoms} {selected.locataire_nom}</strong></p>
              <p>Email : {selected.locataire_email}</p>
              {selected.locataire_telephone && <p>Tél : {selected.locataire_telephone}</p>}
            </div>

            {/* Bien info */}
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>🏠 Bien</h4>
            <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <p><strong>{selected.bien_titre}</strong></p>
              <p>Type : {selected.bien_type} • Adresse : {selected.bien_adresse}</p>
              {selected.bien_surface && <p>Surface : {selected.bien_surface} m²</p>}
              {selected.bien_nombre_pieces && <p>Pièces : {selected.bien_nombre_pieces}</p>}
              {selected.bien_loyer_mensuel && <p>Loyer : {Number(selected.bien_loyer_mensuel).toLocaleString()} Ar/mois</p>}
              {selected.bien_prix && <p>Prix : {Number(selected.bien_prix).toLocaleString()} Ar</p>}
            </div>

            {/* Reservation info */}
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>📋 Réservation</h4>
            <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <p>Type : {selected.type_reservation === 'LOCATION' ? 'Location' : 'Achat'}</p>
              <p>Date : {new Date(selected.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              {selected.commentaire && <p style={{ marginTop: 8 }}>Commentaire : « {selected.commentaire} »</p>}
            </div>

            {/* Actions */}
            {selected.statut === 'EN_ATTENTE' && (
              <>
                <button
                  onClick={() => handleGerer(selected)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 20, width: '100%', justifyContent: 'center' }}
                >
                  <FileText size={16} /> Gérer la réservation — Créer le contrat
                </button>

                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>✉️ Répondre au locataire</h4>
                <textarea
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  placeholder={
                    selected.type_reservation === 'LOCATION'
                      ? "Ex : Votre réservation a été validée. Veuillez consulter votre contrat de bail."
                      : "Ex : Votre réservation a été validée. Veuillez consulter votre contrat de vente."
                  }
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', resize: 'vertical', fontSize: 13, marginBottom: 12 }}
                />
                <button
                  onClick={handleRepondre}
                  disabled={sending || !reponse.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', background: '#16a34a', color: 'white', cursor: (sending || !reponse.trim()) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  <Send size={14} />
                  {sending ? 'Envoi...' : 'Envoyer la réponse et traiter'}
                </button>
              </>
            )}

            {selected.statut === 'TRAITEE' && selected.reponse_admin && (
              <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 6, borderLeft: '3px solid #22c55e', marginTop: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>✅ Réponse envoyée</p>
                <p style={{ fontSize: 13, color: '#15803d' }}>{selected.reponse_admin}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setSelected(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100, display: 'flex', alignItems: 'center', gap: 8, background: '#166534', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <CalendarCheck size={16} /> {toast}
        </div>
      )}
    </div>
  )
}
