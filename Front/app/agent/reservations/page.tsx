'use client'

import { useState, useEffect } from 'react'
import { Eye, Send, FileText, CalendarCheck, X, Search, Inbox } from 'lucide-react'
import { getReservations, repondreReservation, ReservationData } from '@/lib/api'
import { useRouter } from 'next/navigation'

function StatutBadge({ statut }: { statut: string }) {
  const cls = statut === 'TRAITEE' ? 'valide' : statut === 'ANNULEE' ? 'annulee' : 'attente'
  const label = statut === 'TRAITEE' ? 'Traitée' : statut === 'ANNULEE' ? 'Annulée' : 'En attente'
  return <span className={`agent-badge ${cls}`}>{label}</span>
}

function TypeBadge({ type }: { type: string }) {
  const isLocation = type === 'LOCATION'
  return <span className={`agent-badge ${isLocation ? 'location' : 'achat'}`}>{isLocation ? 'Location' : 'Achat'}</span>
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
    setError(null)
    getReservations()
      .then(setReservations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const pendingCount = reservations.filter(r => r.statut === 'EN_ATTENTE').length

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
    <>
      <div className="agent-head">
        <div>
          <p className="eyebrow">GESTION</p>
          <h1>Réservations</h1>
          <p className="subtitle">Consultez et gérez les réservations soumises par les locataires.</p>
        </div>
        <div className="agent-head-actions">
          <span className={`agent-badge ${pendingCount > 0 ? 'attente' : 'valide'}`}>
            {pendingCount > 0 ? `${pendingCount} en attente` : 'Aucune en attente'}
          </span>
        </div>
      </div>

      <article className="panel">
        <div className="agent-toolbar">
          <div className="agent-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (locataire, bien)..." aria-label="Rechercher une réservation" />
          </div>
          <select className="agent-select" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} aria-label="Filtrer par statut">
            <option value="Tous">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="TRAITEE">Traitée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
        </div>

        {loading ? (
          <div className="agent-loading">Chargement des réservations...</div>
        ) : error ? (
          <div className="agent-empty">
            <h2>Chargement impossible</h2>
            <p>{error}</p>
            <button className="agent-btn agent-btn-primary" onClick={fetchData}>Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="agent-empty">
            <Inbox size={30} />
            <h2>Aucune réservation trouvée</h2>
            <p>Aucune demande ne correspond aux filtres actuels.</p>
          </div>
        ) : (
          <div className="agent-table-wrap">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>Locataire</th>
                  <th>Bien</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th className="center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td><strong style={{ color: 'var(--navy)' }}>{r.locataire_prenoms} {r.locataire_nom}</strong></td>
                    <td>{r.bien_titre}</td>
                    <td><TypeBadge type={r.type_reservation} /></td>
                    <td><StatutBadge statut={r.statut} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.date_creation).toLocaleDateString('fr-FR')}</td>
                    <td className="center">
                      <button className="agent-row-chev" style={{ margin: '0 auto' }} onClick={() => { setSelected(r); setReponse('') }} title="Voir le détail" aria-label={`Voir la réservation ${r.id}`}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {selected && (
        <div className="agent-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="agent-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="agent-modal-head">
              <div>
                <p className="eyebrow">RÉSERVATION #{selected.id}</p>
                <h2>Détail de la demande</h2>
              </div>
              <button className="agent-modal-close" onClick={() => setSelected(null)} aria-label="Fermer"><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <TypeBadge type={selected.type_reservation} />
              <StatutBadge statut={selected.statut} />
            </div>

            <h4 className="agent-detail-label">Locataire</h4>
            <div className="agent-info-box blue" style={{ marginBottom: 16 }}>
              <strong>{selected.locataire_prenoms} {selected.locataire_nom}</strong>
              <div>Email : {selected.locataire_email}</div>
              {selected.locataire_telephone && <div>Tél : {selected.locataire_telephone}</div>}
            </div>

            <h4 className="agent-detail-label">Bien</h4>
            <div className="agent-info-box blue" style={{ background: '#f8fafc', borderColor: 'var(--border)', color: 'var(--navy)' }}>
              <strong>{selected.bien_titre}</strong>
              <div style={{ color: 'var(--muted-foreground)' }}>Type : {selected.bien_type} • Adresse : {selected.bien_adresse}</div>
              {selected.bien_surface && <div>Surface : {selected.bien_surface} m²</div>}
              {selected.bien_nombre_pieces && <div>Pièces : {selected.bien_nombre_pieces}</div>}
              {selected.bien_loyer_mensuel && <div>Loyer : {Number(selected.bien_loyer_mensuel).toLocaleString('fr-FR')} Ar/mois</div>}
              {selected.bien_prix && <div>Prix : {Number(selected.bien_prix).toLocaleString('fr-FR')} Ar</div>}
            </div>

            <h4 className="agent-detail-label">Réservation</h4>
            <div className="agent-info-box blue" style={{ background: '#f8fafc', borderColor: 'var(--border)', color: 'var(--navy)' }}>
              <div>Type : {selected.type_reservation === 'LOCATION' ? 'Location' : 'Achat'}</div>
              <div>Date : {new Date(selected.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              {selected.commentaire && <div style={{ marginTop: 8 }}>Commentaire : « {selected.commentaire} »</div>}
            </div>

            {selected.statut === 'EN_ATTENTE' && (
              <>
                <button className="agent-btn agent-btn-primary" onClick={() => handleGerer(selected)} style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                  <FileText size={16} /> Gérer — Créer le contrat
                </button>

                <h4 className="agent-detail-label">Répondre au locataire</h4>
                <label className="agent-field full">
                  <textarea
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
                    placeholder={selected.type_reservation === 'LOCATION'
                      ? "Ex : Votre réservation a été validée. Veuillez consulter votre contrat de bail."
                      : "Ex : Votre réservation a été validée. Veuillez consulter votre contrat de vente."}
                    rows={3}
                  />
                </label>
                <div className="agent-modal-actions" style={{ borderTop: 0, paddingTop: 12, marginTop: 12 }}>
                  <button className="agent-btn agent-btn-ghost" onClick={() => setSelected(null)}>Fermer</button>
                  <button className="agent-btn agent-btn-success" onClick={handleRepondre} disabled={sending || !reponse.trim()}>
                    <Send size={14} />
                    {sending ? 'Envoi...' : 'Envoyer et traiter'}
                  </button>
                </div>
              </>
            )}

            {selected.statut === 'TRAITEE' && selected.reponse_admin && (
              <div className="agent-info-box green">
                <strong>Réponse envoyée</strong>
                <div>{selected.reponse_admin}</div>
              </div>
            )}

            {selected.statut !== 'EN_ATTENTE' && (
              <div className="agent-modal-actions">
                <button className="agent-btn agent-btn-ghost" onClick={() => setSelected(null)}>Fermer</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="agent-toast">
          <CalendarCheck size={16} /> {toast}
        </div>
      )}
    </>
  )
}
