'use client'

import '@/app/admin/admin.css'
import { useState, useEffect } from 'react'
import { Eye, Send, FileText, CalendarCheck, X, Search } from 'lucide-react'
import { getReservations, repondreReservation, ReservationData } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'

function StatutBadge({ statut }: { statut: string }) {
  const { t } = useTranslation()
  switch (statut) {
    case 'TRAITEE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {t("admin.reservations.status_processed", 'Traitée')}
        </span>
      )
    case 'ANNULEE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border dark:border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {t("admin.reservations.status_cancelled", 'Annulée')}
        </span>
      )
    case 'EN_ATTENTE':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {t("admin.reservations.status_pending", 'En attente')}
        </span>
      )
  }
}

function TypeBadge({ type }: { type: string }) {
  const { t } = useTranslation()
  const isLocation = type === 'LOCATION'
  if (isLocation) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:border dark:border-blue-500/30">
        {t("card.for_rent", 'À louer')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-500/15 dark:text-purple-400 dark:border dark:border-purple-500/30">
      {t("card.for_sale", 'À acheter')}
    </span>
  )
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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="welcome-row mb-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("admin.reservations.title_start", "Gestion des")}{" "}
            <span className="text-slate-900 dark:text-white font-extrabold">{t("admin.reservations.title_highlight", "Réservations")}</span>
          </h1>
          <p className="subtitle text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("admin.reservations.subtitle", "Consultez et gérez les réservations soumises par les locataires.")}
          </p>
        </div>
      </div>

      {/* Main card container with integrated toolbar */}
      <section className="panel user-panel flex-1 flex flex-col">
        <div className="user-toolbar">
          <div className="search-box table-search flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <Search size={16} />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={t("admin.reservations.search_placeholder", "Rechercher une réservation par bien ou candidat...")} 
              className="bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none w-full"
            />
          </div>
          <select 
            value={filterStatut} 
            onChange={(e) => setFilterStatut(e.target.value)}
            aria-label={t("admin.reservations.filter_all_status", "Tous les statuts")}
            className="rounded-lg text-xs"
          >
            <option value="Tous">{t("admin.reservations.filter_all_status", "Tous les statuts")}</option>
            <option value="EN_ATTENTE">{t("admin.reservations.status_pending", "En attente")}</option>
            <option value="TRAITEE">{t("admin.reservations.status_processed", "Traitée")}</option>
            <option value="ANNULEE">{t("admin.reservations.status_cancelled", "Annulée")}</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-wrap flex-1">
          <table>
            <thead>
              <tr>
                <th className="uppercase">{t("admin.reservations.col_candidate", "CANDIDAT")}</th>
                <th className="uppercase">{t("admin.reservations.col_property", "BIEN CONCERNÉ")}</th>
                <th className="uppercase">{t("admin.reservations.col_type", "TYPE DE DEMANDE")}</th>
                <th className="uppercase">{t("admin.reservations.col_status", "STATUT")}</th>
                <th className="uppercase">{t("admin.reservations.col_date", "DATE DE DEMANDE")}</th>
                <th className="uppercase text-right">{t("admin.reservations.col_actions", "ACTIONS")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400 dark:text-slate-500">
                    {t("forms.loading", "Chargement...")}
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-rose-500">
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500">
                    {t("admin.reservations.empty", "Aucune réservation trouvée.")}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="user-initial blue border border-transparent dark:border-slate-700/80 dark:bg-blue-500/15 dark:text-blue-300 shrink-0">
                          {r.locataire_prenoms?.[0] || '?'}{r.locataire_nom?.[0] || '?'}
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-slate-100 block">{r.locataire_prenoms} {r.locataire_nom}</strong>
                          <small className="block text-slate-500 dark:text-slate-400 text-xs mt-0.5">{r.locataire_email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="text-slate-900 dark:text-slate-100 block">{r.bien_titre}</strong>
                      <small className="block text-slate-500 dark:text-slate-400 text-xs mt-0.5">{r.bien_adresse}</small>
                    </td>
                    <td><TypeBadge type={r.type_reservation} /></td>
                    <td><StatutBadge statut={r.statut} /></td>
                    <td className="text-slate-700 dark:text-slate-300 text-xs">
                      {new Date(r.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <div className="row-actions flex items-center justify-end">
                        <button 
                          onClick={() => { setSelected(r); setReponse('') }} 
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 transition-colors cursor-pointer" 
                          title={t("forms.view", "Voir le détail")}
                          aria-label={t("forms.view", "Voir le détail")}
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal détail */}
      {selected && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <section 
            className="w-full max-w-[620px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <button 
              onClick={() => setSelected(null)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              aria-label={t("forms.close", "Fermer")}
            >
              <X size={18} />
            </button>

            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/20">
              <CalendarCheck size={20} />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">
              {t("admin.reservations.detail_modal_title", "Détail de la réservation")} #{selected.id}
            </h2>

            <div className="flex gap-2 my-4">
              <TypeBadge type={selected.type_reservation} />
              <StatutBadge statut={selected.statut} />
            </div>

            {/* Locataire info */}
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {t("admin.reservations.tenant_info", "Information sur le candidat / locataire")}
            </h4>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs mb-4 flex flex-col gap-1.5">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm m-0">
                {selected.locataire_prenoms} {selected.locataire_nom}
              </p>
              <p className="text-slate-600 dark:text-slate-300 m-0">
                <span className="text-slate-500 dark:text-slate-400">{t("profile.email", "Email")} : </span>
                {selected.locataire_email}
              </p>
              {selected.locataire_telephone && (
                <p className="text-slate-600 dark:text-slate-300 m-0">
                  <span className="text-slate-500 dark:text-slate-400">{t("profile.phone", "Tél")} : </span>
                  {selected.locataire_telephone}
                </p>
              )}
            </div>

            {/* Bien info */}
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {t("admin.reservations.property_info", "Information sur le bien")}
            </h4>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs mb-4 flex flex-col gap-1.5">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm m-0">{selected.bien_titre}</p>
              <p className="text-slate-600 dark:text-slate-300 m-0">
                <span className="text-slate-500 dark:text-slate-400">{t("forms.property_type", "Type")} : </span>
                {selected.bien_type} • <span className="text-slate-500 dark:text-slate-400">{t("forms.address", "Adresse")} : </span>{selected.bien_adresse}
              </p>
              {selected.bien_surface && (
                <p className="text-slate-600 dark:text-slate-300 m-0">
                  <span className="text-slate-500 dark:text-slate-400">{t("forms.surface", "Surface")} : </span>
                  {selected.bien_surface} m²
                  {selected.bien_nombre_pieces ? ` • ${selected.bien_nombre_pieces} ${t("forms.rooms_count", "pièces")}` : ''}
                </p>
              )}
              {selected.bien_loyer_mensuel && (
                <p className="text-slate-900 dark:text-white font-semibold m-0">
                  <span className="text-slate-500 dark:text-slate-400 font-normal">{t("forms.monthly_rent", "Loyer")} : </span>
                  {Number(selected.bien_loyer_mensuel).toLocaleString('fr-FR')} Ar / {t("card.per_month", "mois")}
                </p>
              )}
              {selected.bien_prix && (
                <p className="text-slate-900 dark:text-white font-semibold m-0">
                  <span className="text-slate-500 dark:text-slate-400 font-normal">{t("forms.sale_price", "Prix")} : </span>
                  {Number(selected.bien_prix).toLocaleString('fr-FR')} Ar
                </p>
              )}
            </div>

            {/* Reservation info */}
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {t("admin.reservations.title", "Réservation")}
            </h4>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs mb-4 flex flex-col gap-1.5">
              <p className="text-slate-600 dark:text-slate-300 m-0">
                <span className="text-slate-500 dark:text-slate-400">{t("forms.property_type", "Type")} : </span>
                {selected.type_reservation === 'LOCATION' ? t("card.for_rent", 'Location') : t("card.for_sale", 'Achat')}
              </p>
              <p className="text-slate-600 dark:text-slate-300 m-0">
                <span className="text-slate-500 dark:text-slate-400">{t("admin.reservations.col_date", "Date de soumission")} : </span>
                {new Date(selected.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {selected.commentaire && (
                <div className="mt-1">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">{t("admin.reservations.col_comment", "Commentaire du candidat")} :</span>
                  <p className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 italic m-0">
                    « {selected.commentaire} »
                  </p>
                </div>
              )}
            </div>

            {/* Actions when EN_ATTENTE */}
            {selected.statut === 'EN_ATTENTE' && (
              <>
                <button
                  onClick={() => handleGerer(selected)}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mb-4"
                >
                  <FileText size={16} /> {t("admin.reservations.manage_reservation_btn", "Gérer la réservation")}
                </button>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    {t("admin.reservations.reply_modal_title", "Répondre à la réservation")}
                  </h4>
                  
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
                      <span>{t("admin.reservations.decision_label", "Décision")}</span>
                      <select
                        value={newStatut}
                        onChange={(e) => setNewStatut(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="TRAITEE">{t("admin.reservations.accept_opt", "Accepter la réservation (Traitée)")}</option>
                        <option value="ANNULEE">{t("admin.reservations.reject_opt", "Refuser la réservation (Annulée)")}</option>
                      </select>
                    </label>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
                      <span>{t("admin.reservations.reply_message_label", "Message de réponse")}</span>
                      <textarea
                        value={reponse}
                        onChange={(e) => setReponse(e.target.value)}
                        placeholder={
                          selected.type_reservation === 'LOCATION'
                            ? t("admin.reservations.reply_rent_placeholder", "Ex : Votre réservation a été validée. Veuillez consulter votre contrat de bail pour prendre connaissance des détails.")
                            : t("admin.reservations.reply_sale_placeholder", "Ex : Votre réservation a été validée. Veuillez consulter votre contrat de vente pour prendre connaissance des détails.")
                        }
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                      />
                    </label>
                  </div>
                  
                  <div className="flex justify-start">
                    <button
                      onClick={handleRepondre}
                      disabled={sending || !reponse.trim()}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        newStatut === 'TRAITEE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      <Send size={14} />
                      {sending 
                        ? t("forms.saving", 'Envoi...') 
                        : (newStatut === 'TRAITEE' 
                            ? t("admin.reservations.send_reply_btn", 'Envoyer la réponse') 
                            : t("admin.reservations.reject_and_send_btn", 'Refuser et envoyer la réponse'))}
                    </button>
                  </div>
                </div>
              </>
            )}

            {selected.statut === 'TRAITEE' && selected.reponse_admin && (
              <div className="p-3 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 my-3">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  ✓ {t("admin.reservations.reply_sent_label", "Réponse envoyée")}
                </p>
                <p className="m-0 text-slate-800 dark:text-slate-200">{selected.reponse_admin}</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button 
                type="button"
                onClick={() => setSelected(null)} 
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {t("forms.close", "Fermer")}
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg">
          <CalendarCheck size={16} /> {toast}
        </div>
      )}
    </div>
  )
}
