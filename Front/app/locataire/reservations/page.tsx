'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { CalendarCheck, FileText, MessageSquare } from 'lucide-react'
import { getProfil, getReservations, ReservationData } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

import { LocataireSidebar } from "@/components/organisms/LocataireSidebar"
import { LocataireTopbar } from "@/components/organisms/LocataireTopbar"
import { ProfileModal } from "@/components/organisms/ProfileModal"

function StatutBadge({ statut, t }: { statut: string; t: any }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    EN_ATTENTE: { bg: '#fef3c7', color: '#92400e', label: t('dashboard.common.status_en_attente', 'En attente') },
    TRAITEE: { bg: '#dcfce7', color: '#166534', label: t('locataire_pages.paiements.status_validated', 'Traitée') },
    ANNULEE: { bg: '#fef2f2', color: '#dc2626', label: t('locataire_pages.paiements.status_cancelled', 'Annulée') },
  }
  const c = config[statut] || config.EN_ATTENTE
  return (
    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function TypeBadge({ type, t }: { type: string; t: any }) {
  const isLocation = type === 'LOCATION'
  return (
    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: isLocation ? '#dbeafe' : '#fef3c7', color: isLocation ? '#1e40af' : '#92400e' }}>
      {isLocation ? t('types.location', 'Location') : t('types.sale', 'Achat')}
    </span>
  )
}

export default function MesReservationsPage() {
  const { t, lang } = useTranslation()
  const [user, setUser] = useState<any>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const [reservations, setReservations] = useState<ReservationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ReservationData | null>(null)

  useEffect(() => {
    getProfil().then(setUser).catch(console.error)
    getReservations()
      .then(setReservations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app-shell">
      <LocataireSidebar mobileNav={mobileNav} setMobileNav={setMobileNav} activeHref="/locataire/reservations" user={user} />

      <main className="main-content">
        <LocataireTopbar
          setMobileNav={setMobileNav}
          setShowProfile={setShowProfile}
          activeLabel={t('dashboard.nav.my_reservations', 'Mes réservations')}
          user={user}
        />

        <div className="page-body">
          <div style={{ marginBottom: 24 }}>
            <p className="section-kicker">{t('locataire_pages.reservations.eyebrow', 'MES RÉSERVATIONS')}</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {t('locataire_pages.reservations.title', 'Suivi de vos réservations')}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
              {t('locataire_pages.reservations.subtitle', "Consultez l'état de vos réservations et les réponses de l'administration.")}
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><p>{t('forms.loading', 'Chargement...')}</p></div>
          ) : error ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}><p>{error}</p></div>
          ) : reservations.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
              <CalendarCheck size={40} style={{ margin: '0 auto 12px', color: 'var(--muted-foreground)' }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>
                {t('locataire_pages.reservations.empty_title', 'Aucune réservation')}
              </p>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                {t('locataire_pages.reservations.empty_desc', "Vous n'avez pas encore soumis de réservation. Explorez les biens disponibles pour commencer.")}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reservations.map((r) => (
                <div
                  key={r.id}
                  className="panel"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(r)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{r.bien_titre || `Bien #${r.bien}`}</h3>
                      <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                        {r.bien_adresse} • {new Date(r.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <TypeBadge type={r.type_reservation} t={t} />
                      <StatutBadge statut={r.statut} t={t} />
                    </div>
                  </div>

                  {r.statut === 'TRAITEE' && r.reponse_admin && (
                    <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 6, borderLeft: '3px solid #22c55e' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MessageSquare size={13} /> {t('locataire_pages.reservations.admin_response', "Réponse de l'administration")}
                      </p>
                      <p style={{ fontSize: 13, color: '#15803d' }}>{r.reponse_admin}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal détail */}
      {selected && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="panel" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                {t('locataire_pages.reservations.detail_title', 'Détail de la réservation')}
              </h2>
              <button onClick={() => setSelected(null)} aria-label={t('common.close', 'Fermer')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <TypeBadge type={selected.type_reservation} t={t} />
              <StatutBadge statut={selected.statut} t={t} />
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>
              {t('locataire_pages.reservations.property_info', 'Information sur le bien')}
            </h4>
            <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <p><strong>{selected.bien_titre}</strong></p>
              <p>{selected.bien_type} • {selected.bien_adresse}</p>
              {selected.bien_surface && <p>{t('locataire_pages.reservations.surface', 'Surface')} : {selected.bien_surface} m²</p>}
              {selected.bien_nombre_pieces && <p>{t('locataire_pages.reservations.rooms', 'Pièces')} : {selected.bien_nombre_pieces}</p>}
              {selected.bien_loyer_mensuel && <p>{t('locataire_pages.reservations.rent', 'Loyer')} : {Number(selected.bien_loyer_mensuel).toLocaleString()} Ar/{t('card.per_month', 'mois')}</p>}
              {selected.bien_prix && <p>{t('locataire_pages.reservations.price', 'Prix')} : {Number(selected.bien_prix).toLocaleString()} Ar</p>}
            </div>

            {selected.commentaire && (
              <>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>
                  {t('locataire_pages.reservations.your_comment', '💬 Votre commentaire')}
                </h4>
                <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
                  {selected.commentaire}
                </div>
              </>
            )}

            <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              {t('locataire_pages.reservations.submitted_on', 'Soumise le')} {new Date(selected.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>

            {selected.statut === 'TRAITEE' && selected.reponse_admin && (
              <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 6, borderLeft: '3px solid #22c55e' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>
                  ✅ {t('locataire_pages.reservations.admin_response', "Réponse de l'administration")}
                </p>
                <p style={{ fontSize: 13, color: '#15803d' }}>{selected.reponse_admin}</p>
              </div>
            )}

            {selected.contrat && (
              <a
                href={`/locataire/contrat`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '8px 16px', borderRadius: 6, background: 'var(--primary)', color: 'var(--primary-foreground)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              >
                <FileText size={14} /> {t('locataire_pages.reservations.see_contract', 'Voir mon contrat')}
              </a>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setSelected(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>
                {t('common.close', 'Fermer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onProfileUpdated={(res) => setUser(res.user)} />}
    </div>
  )
}
