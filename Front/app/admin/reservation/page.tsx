'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { Eye, Send, FileText, CalendarCheck, X, Search } from 'lucide-react'
import { getReservations, repondreReservation, ReservationData } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'

function StatutBadge({ statut }: { statut: string }) {
  const { t } = useTranslation()
  const config: Record<string, { bg: string; color: string; label: string }> = {
    EN_ATTENTE: { bg: '#fef3c7', color: '#92400e', label: t("admin.reservations.status_pending", 'En attente') },
    TRAITEE: { bg: '#dcfce7', color: '#166534', label: t("admin.reservations.status_processed", 'Traitée') },
    ANNULEE: { bg: '#fef2f2', color: '#dc2626', label: t("admin.reservations.status_cancelled", 'Annulée') },
  }
  const c = config[statut] || config.EN_ATTENTE
  return <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>{c.label}</span>
}

function TypeBadge({ type }: { type: string }) {
  const { t } = useTranslation()
  const isLocation = type === 'LOCATION'
  return <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: isLocation ? '#dbeafe' : '#fef3c7', color: isLocation ? '#1e40af' : '#92400e' }}>{isLocation ? t("card.for_rent", 'Location') : t("card.for_sale", 'Achat')}</span>
}

export default function AdminReservationsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [reservations, setReservations] = useState<ReservationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('Tous')
  const [selected, setSelected] = useState<ReservationData | null>(null)
  const [reponse, setReponse] = useState('')
  const [newStatut, setNewStatut] = useState('TRAITEE')
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
      await repondreReservation(selected.id, { reponse_admin: reponse, statut: newStatut })
      setToast(t("admin.reservations.reply_sent_toast", 'Réponse envoyée au locataire.'))
      setSelected(null)
      setReponse('')
      setNewStatut('TRAITEE')
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
    router.push(`/admin/contrat?reservation_bien=${r.bien}&reservation_locataire=${r.locataire}&reservation_type=${typeContrat}&reservation_id=${r.id}`)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p className="section-kicker">{t("admin.reservations.eyebrow", "GESTION")}</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t("admin.reservations.title", "Réservations")}</h1>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
          {t("admin.reservations.subtitle", "Consultez et gérez les réservations soumises par les locataires.")}
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.reservations.search_placeholder", "Rechercher...")} style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13 }} />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13 }}>
          <option value="Tous">{t("admin.reservations.filter_all_status", "Tous les statuts")}</option>
          <option value="EN_ATTENTE">{t("admin.reservations.status_pending", "En attente")}</option>
          <option value="TRAITEE">{t("admin.reservations.status_processed", "Traitée")}</option>
          <option value="ANNULEE">{t("admin.reservations.status_cancelled", "Annulée")}</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}><p>{t("forms.loading", "Chargement...")}</p></div>
      ) : error ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}><p>{error}</p></div>
      ) : (
        <div className="panel" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>{t("admin.locataires.col_tenant", "Locataire")}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>{t("admin.reservations.col_property", "Bien")}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>{t("admin.reservations.col_type", "Type")}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>{t("admin.reservations.col_status", "Statut")}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>{t("admin.reservations.col_date", "Date")}</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 12 }}>{t("admin.reservations.col_actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>{t("admin.reservations.empty", "Aucune réservation trouvée.")}</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}>{r.locataire_prenoms} {r.locataire_nom}</td>
                  <td style={{ padding: '10px 12px' }}>{r.bien_titre}</td>
                  <td style={{ padding: '10px 12px' }}><TypeBadge type={r.type_reservation} /></td>
                  <td style={{ padding: '10px 12px' }}><StatutBadge statut={r.statut} /></td>
                  <td style={{ padding: '10px 12px' }}>{new Date(r.date_creation).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button onClick={() => { setSelected(r); setReponse('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} title={t("forms.view", "Voir le détail")}>
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
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t("admin.reservations.detail_modal_title", "Détail de la réservation")} #{selected.id}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <TypeBadge type={selected.type_reservation} />
              <StatutBadge statut={selected.statut} />
            </div>

            {/* Locataire info */}
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>{t("admin.reservations.tenant_info", "Information sur le locataire")}</h4>
            <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <p><strong>{selected.locataire_prenoms} {selected.locataire_nom}</strong></p>
              <p>{t("profile.email", "Email")} : {selected.locataire_email}</p>
              {selected.locataire_telephone && <p>{t("profile.phone", "Tél")} : {selected.locataire_telephone}</p>}
            </div>

            {/* Bien info */}
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>{t("admin.reservations.property_info", "Information sur le bien")}</h4>
            <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <p><strong>{selected.bien_titre}</strong></p>
              <p>{t("forms.property_type", "Type")} : {selected.bien_type} • {t("forms.address", "Adresse")} : {selected.bien_adresse}</p>
              {selected.bien_surface && <p>{t("forms.surface", "Surface")} : {selected.bien_surface} m²</p>}
              {selected.bien_nombre_pieces && <p>{t("forms.rooms_count", "Pièces")} : {selected.bien_nombre_pieces}</p>}
              {selected.bien_loyer_mensuel && <p>{t("forms.monthly_rent", "Loyer")} : {Number(selected.bien_loyer_mensuel).toLocaleString()} Ar/mois</p>}
              {selected.bien_prix && <p>{t("forms.sale_price", "Prix")} : {Number(selected.bien_prix).toLocaleString()} Ar</p>}
            </div>

            {/* Reservation info */}
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>{t("admin.reservations.title", "Réservation")}</h4>
            <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <p>{t("forms.property_type", "Type")} : {selected.type_reservation === 'LOCATION' ? t("card.for_rent", 'Location') : t("card.for_sale", 'Achat')}</p>
              <p>{t("admin.reservations.col_date", "Date")} : {new Date(selected.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              {selected.commentaire && <p style={{ marginTop: 8 }}>{t("admin.reservations.col_comment", "Commentaire")} : « {selected.commentaire} »</p>}
            </div>

            {/* Actions */}
            {selected.statut === 'EN_ATTENTE' && (
              <>
                {/* Gérer la réservation */}
                <button
                  onClick={() => handleGerer(selected)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 20, width: '100%', justifyContent: 'center' }}
                >
                  <FileText size={16} /> {t("admin.reservations.manage_reservation_btn", "Gérer la réservation")}
                </button>

                {/* Répondre au locataire */}
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>{t("admin.reservations.reply_modal_title", "Répondre à la réservation")}</h4>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t("admin.reservations.decision_label", "Décision")}</label>
                  <select
                    value={newStatut}
                    onChange={(e) => setNewStatut(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13 }}
                  >
                    <option value="TRAITEE">{t("admin.reservations.accept_opt", "Accepter la réservation (Traitée)")}</option>
                    <option value="ANNULEE">{t("admin.reservations.reject_opt", "Refuser la réservation (Annulée)")}</option>
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t("admin.reservations.reply_message_label", "Message de réponse")}</label>
                  <textarea
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
                    placeholder={
                      selected.type_reservation === 'LOCATION'
                        ? t("admin.reservations.reply_rent_placeholder", "Ex : Votre réservation a été validée. Veuillez consulter votre contrat de bail pour prendre connaissance des détails.")
                        : t("admin.reservations.reply_sale_placeholder", "Ex : Votre réservation a été validée. Veuillez consulter votre contrat de vente pour prendre connaissance des détails.")
                    }
                    rows={3}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', resize: 'vertical', fontSize: 13 }}
                  />
                </div>
                
                <button
                  onClick={handleRepondre}
                  disabled={sending || !reponse.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', background: newStatut === 'TRAITEE' ? '#16a34a' : '#dc2626', color: 'white', cursor: (sending || !reponse.trim()) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  <Send size={14} />
                  {sending ? t("forms.saving", 'Envoi...') : (newStatut === 'TRAITEE' ? t("admin.reservations.send_reply_btn", 'Envoyer la réponse') : t("admin.reservations.reject_and_send_btn", 'Refuser et envoyer la réponse'))}
                </button>
              </>
            )}

            {selected.statut === 'TRAITEE' && selected.reponse_admin && (
              <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 6, borderLeft: '3px solid #22c55e', marginTop: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>✅ {t("admin.reservations.reply_sent_label", "Réponse envoyée")}</p>
                <p style={{ fontSize: 13, color: '#15803d' }}>{selected.reponse_admin}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setSelected(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>{t("forms.close", "Fermer")}</button>
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
