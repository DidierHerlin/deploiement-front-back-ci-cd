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
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-[560px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-slate-900 dark:text-white font-bold text-lg m-0">
                {t('locataire_pages.reservations.detail_title', 'Détail de la réservation')}
              </h2>
              <button 
                onClick={() => setSelected(null)} 
                aria-label={t('common.close', 'Fermer')} 
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors border-0 bg-transparent text-base"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <TypeBadge type={selected.type_reservation} t={t} />
              <StatutBadge statut={selected.statut} t={t} />
            </div>

            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t('locataire_pages.reservations.property_info', 'Information sur le bien')}
            </h4>
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 mb-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <p className="m-0"><strong className="text-slate-900 dark:text-white font-semibold">{selected.bien_titre}</strong></p>
              <p className="m-0 text-slate-500 dark:text-slate-400">{selected.bien_type} • {selected.bien_adresse}</p>
              {selected.bien_surface && <p className="m-0">{t('locataire_pages.reservations.surface', 'Surface')} : {selected.bien_surface} m²</p>}
              {selected.bien_nombre_pieces && <p className="m-0">{t('locataire_pages.reservations.rooms', 'Pièces')} : {selected.bien_nombre_pieces}</p>}
              {selected.bien_loyer_mensuel && <p className="m-0 font-medium text-blue-600 dark:text-blue-400">{t('locataire_pages.reservations.rent', 'Loyer')} : {Number(selected.bien_loyer_mensuel).toLocaleString()} Ar / {t('card.per_month', 'mois')}</p>}
              {selected.bien_prix && <p className="m-0 font-medium text-blue-600 dark:text-blue-400">{t('locataire_pages.reservations.price', 'Prix')} : {Number(selected.bien_prix).toLocaleString()} Ar</p>}
            </div>

            {selected.commentaire && (
              <>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {t('locataire_pages.reservations.your_comment', ' Votre commentaire')}
                </h4>
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 mb-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {selected.commentaire}
                </div>
              </>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              {t('locataire_pages.reservations.submitted_on', 'Soumise le')} {new Date(selected.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>

            {selected.statut === 'TRAITEE' && selected.reponse_admin && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                   {t('locataire_pages.reservations.admin_response', "Réponse de l'administration")}
                </p>
                <p className="m-0">{selected.reponse_admin}</p>
              </div>
            )}

            {selected.contrat && (
              <a
                href={`/locataire/contrat`}
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white no-underline text-xs sm:text-sm font-semibold transition-colors"
              >
                <FileText size={14} /> {t('locataire_pages.reservations.see_contract', 'Voir mon contrat')}
              </a>
            )}

            <div className="flex justify-end mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setSelected(null)} 
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors cursor-pointer"
              >
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
