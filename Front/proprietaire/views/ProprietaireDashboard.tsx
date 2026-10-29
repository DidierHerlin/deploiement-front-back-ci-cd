'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { deconnecter } from '@/lib/auth'
import { getProfil } from '@/lib/api'
import {
  Bell, Building2, CalendarDays, ChevronDown, ChevronRight, CircleDollarSign,
  FileText, Home, LayoutDashboard, Menu, MoreHorizontal, Search, Settings,
  UserRound, WalletCards, X, ArrowUpRight, CircleAlert, Eye,
  CheckCircle2, Clock3,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard } from "@/components/molecules/locataire_StatCard"
import '../styles/dashboard.css'
import { getProprietaireDashboardStats } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

export function ProprietaireDashboard() {
  const { t, lang } = useTranslation()
  const [active, setActive] = useState('Vue d’ensemble')
  const [mobileNav, setMobileNav] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAllPayments, setShowAllPayments] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getProfil().catch(err => {
        console.error("Erreur profil", err)
        return { prenoms: '', nom: '', id: null }
      }),
      getProprietaireDashboardStats().catch(err => {
        console.error("Erreur dashboard stats", err)
        return null
      })
    ]).then(([profil, stats]) => {
      setUserName(profil.prenoms || profil.nom || 'Propriétaire')
      setUserId(profil.id)
      setDashboardData(stats)
      setLoading(false)
    })
  }, [])

  if (loading || !dashboardData) {
    return <div style={{ padding: '20px', color: '#6b7280' }}>{t("dashboard.common.loading", "Chargement du tableau de bord...")}</div>
  }

  const { biens, revenus, prochaine_echeance, recent_echeances, recent_paiements, recent_notifications } = dashboardData

  const chartData = (revenus.chart_data || []).map((d: any) => {
    const dateObj = new Date(d.year, d.month - 1, 1)
    return {
      ...d,
      name: dateObj.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'short' }).replace('.', '')
    }
  })

  let evolutionText = "stable vs mois dernier"
  if (revenus.mois_dernier > 0) {
    const pourcentageEvolution = ((revenus.ce_mois - revenus.mois_dernier) / revenus.mois_dernier) * 100
    const sign = pourcentageEvolution > 0 ? '+' : ''
    evolutionText = `${sign}${pourcentageEvolution.toFixed(1).replace('.', ',')}% vs mois dernier`
  } else if (revenus.ce_mois > 0) {
    evolutionText = "+100% vs mois dernier"
  } else {
    evolutionText = "Aucun revenu ce mois-ci"
  }

  const biensDetail = []
  if (biens.loues > 0) biensDetail.push(`${biens.loues} loué${biens.loues > 1 ? 's' : ''}`)
  if (biens.disponibles > 0) biensDetail.push(`${biens.disponibles} disponible${biens.disponibles > 1 ? 's' : ''}`)
  const biensDetailStr = biensDetail.length > 0 ? biensDetail.join(' · ') : 'Aucun bien enregistré'
  const tauxDetailStr = biens.total > 0 ? `${biens.loues} bien${biens.loues > 1 ? 's' : ''} sur ${biens.total} occupé${biens.loues > 1 ? 's' : ''}` : "Aucun bien à occuper"

  const totalBiens = biens.total
  const revenuCeMois = revenus.ce_mois
  const tauxOccupation = biens.taux_occupation

  let prochaineEcheanceStr = '-'
  let loyersAttendusStr = 'Aucune échéance à venir'
  let toneEcheance = 'green'

  if (prochaine_echeance && prochaine_echeance.date) {
    const dateObj = new Date(prochaine_echeance.date)
    const day = dateObj.getDate().toString().padStart(2, '0')
    const month = dateObj.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'short' })
    prochaineEcheanceStr = `${day} ${month}.`
    loyersAttendusStr = `${prochaine_echeance.nombre} loyer${prochaine_echeance.nombre > 1 ? 's' : ''} attendu${prochaine_echeance.nombre > 1 ? 's' : ''}`
    toneEcheance = 'red'
  }

  const filtered = (biens.recent_biens || []).filter((item: any) => `${item.titre} ${item.adresse}`.toLowerCase().includes(query.toLowerCase()))
  const validPaiements = recent_paiements || []
  const visiblePayments = showAllPayments ? validPaiements : validPaiements.slice(0, 3)
  const ownerEcheances = recent_echeances || []
  const notificationsList = recent_notifications || []

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</p>
          <h1>{t("dashboard.proprietaire.welcome_title", "Bonjour")}{userName ? ` ${userName}` : ''}, <span>{t("dashboard.proprietaire.welcome_highlight", "voici votre patrimoine.")}</span></h1>
          <p className="subtitle">{t("dashboard.proprietaire.welcome_sub", "Suivez vos biens, vos revenus et les événements importants en un coup d’œil.")}</p>
        </div>
      </div>
      <div className="owner-banner dark:bg-slate-900/80 dark:border-slate-800">
        <div className="banner-icon dark:bg-slate-800 dark:text-blue-400"><Home size={19} /></div>
        <div>
          <strong className="dark:text-slate-100">{t("dashboard.proprietaire.banner_title", "Bienvenue dans votre espace propriétaire")}</strong>
          <p className="dark:text-slate-400">{t("dashboard.proprietaire.banner_desc", "Votre agence gère vos biens en toute transparence. Les informations affichées concernent uniquement votre patrimoine.")}</p>
        </div>
        <ChevronRight size={18} className="dark:text-slate-500" />
      </div>
      <section className="stats-grid">
        <StatCard icon={Building2} label={t("dashboard.proprietaire.my_properties", "Mes biens")} value={totalBiens.toString()} detail={biensDetailStr} tone="blue" />
        <StatCard icon={CircleDollarSign} label={t("dashboard.proprietaire.monthly_revenues", "Revenus mensuels")} value={`${revenuCeMois.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} Ariary`} detail={evolutionText} tone="green" />
        <StatCard icon={WalletCards} label={t("dashboard.proprietaire.occupancy_rate", "Taux d’occupation")} value={`${tauxOccupation}%`} detail={tauxDetailStr} tone="orange" />
        <StatCard icon={CalendarDays} label={t("dashboard.proprietaire.next_due", "Prochaine échéance")} value={prochaineEcheanceStr} detail={loyersAttendusStr} tone={toneEcheance} />
      </section>
      <div className="content-grid">
        <section className="panel revenue-panel dark:bg-slate-900/90 dark:border-slate-800">
          <div className="panel-header">
            <div>
              <h2 className="text-slate-900 dark:text-white">{t("dashboard.proprietaire.revenue_chart_title", "Mes revenus locatifs")}</h2>
              <p className="text-slate-500 dark:text-slate-400">{t("dashboard.proprietaire.revenue_chart_sub", "Évolution des encaissements sur les 6 derniers mois")}</p>
            </div>
          </div>
          <div style={{ height: '214px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(val) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'fr-FR').format(val)} width={80} />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} Ariary`, 'Revenus réels']} 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)' }} 
                  itemStyle={{ color: '#3b82f6', fontWeight: 600 }} 
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel deadlines-panel dark:bg-slate-900/90 dark:border-slate-800">
          <div className="panel-header">
            <div>
              <h2 className="text-slate-900 dark:text-white">{t("dashboard.proprietaire.upcoming_deadlines_title", "Événements à venir")}</h2>
              <p className="text-slate-500 dark:text-slate-400">{t("dashboard.proprietaire.upcoming_deadlines_sub", "Les prochaines échéances de vos biens")}</p>
            </div>
            <button className="more-button dark:text-slate-400" aria-label="Plus d’options"><MoreHorizontal size={20} /></button>
          </div>
          <div className="deadline-list">
            {ownerEcheances.length > 0 ? (
              ownerEcheances.slice(0, 3).map((e: any, idx) => {
                const dateObj = e.date_echeance ? new Date(e.date_echeance) : new Date();
                const day = dateObj.getDate().toString().padStart(2, '0');
                const month = dateObj.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'short' }).toUpperCase();
                return (
                  <div className="deadline flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors" key={idx}>
                    <div className="date-block"><strong>{day}</strong><span>{month}</span></div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">Loyer de {e.locataire_nom || 'Locataire inconnu'}</strong>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{e.bien_titre} · {parseFloat(e.montant_attendu).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} Ariary</p>
                    </div>
                    <ChevronRight size={17} className="text-slate-400 dark:text-slate-500" />
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '11px', padding: '10px 0' }} className="text-slate-400 dark:text-slate-500">Aucun événement à venir.</p>
            )}
          </div>
          <button className="link-button dark:text-blue-400">Voir mon calendrier <ArrowUpRight size={15} /></button>
        </section>
      </div>
      <div className="lower-grid">
        <section className="panel dark:bg-slate-900/90 dark:border-slate-800">
          <div className="panel-header">
            <div>
              <h2 className="text-slate-900 dark:text-white">{t("dashboard.proprietaire.payment_history_title", "Historique des paiements")}</h2>
              <p className="text-slate-500 dark:text-slate-400">{t("dashboard.proprietaire.payment_history_sub", "Les derniers encaissements de vos biens")}</p>
            </div>
            <Link href="/proprietaire/paiements" className="outline-button dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
              {t("dashboard.common.view_all", "Tout voir")} <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-slate-400 dark:text-slate-500">LOCATAIRE</th>
                  <th className="text-slate-400 dark:text-slate-500">BIEN</th>
                  <th className="text-slate-400 dark:text-slate-500">MONTANT</th>
                  <th className="text-slate-400 dark:text-slate-500">DATE</th>
                  <th className="text-slate-400 dark:text-slate-500">STATUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visiblePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td>
                      <div className="tenant">
                        <span className="dark:bg-slate-800 dark:text-blue-400">{(payment.locataire_nom || 'XX').substring(0, 2).toUpperCase()}</span>
                        <strong className="text-slate-800 dark:text-slate-200">{payment.locataire_nom || 'Inconnu'}</strong>
                      </div>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">{payment.bien_titre}</td>
                    <td><strong className="text-slate-800 dark:text-slate-200">{((parseFloat(payment.montant_paye as string) || parseFloat(payment.montant as string) || parseFloat(payment.montant_attendu as string) || 0)).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} Ariary</strong></td>
                    <td className="text-slate-500 dark:text-slate-400">{payment.date_paiement ? new Date(payment.date_paiement).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR') : '-'}</td>
                    <td>
                      <span className={`status ${payment.statut === 'PAYE' ? 'paid dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30' : 'late dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30'}`}>
                        {payment.statut === 'PAYE' ? t("dashboard.common.status_paye", "Payé") : t("dashboard.common.status_en_retard", "En retard")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel properties-panel dark:bg-slate-900/90 dark:border-slate-800">
          <div className="panel-header">
            <div>
              <h2 className="text-slate-900 dark:text-white">{t("dashboard.proprietaire.properties_title", "Mes biens immobiliers")}</h2>
              <p className="text-slate-500 dark:text-slate-400">{t("dashboard.proprietaire.properties_sub", "La situation actuelle de votre parc")}</p>
            </div>
            <Link href="/proprietaire/biens" className="outline-button dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
              {t("dashboard.common.view_all", "Tout voir")} <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="property-list">
            {filtered.slice(0, 3).map((property) => (
              <div className="property p-2 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors" key={property.id}>
                <div className={`property-icon ${property.statut === 'LOUE' ? 'blue dark:bg-blue-900/40 dark:text-blue-400' : property.statut === 'DISPONIBLE' ? 'orange dark:bg-amber-900/40 dark:text-amber-400' : 'green dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                  <Building2 size={18} />
                </div>
                <div className="property-info">
                  <strong className="text-slate-800 dark:text-slate-200">{property.titre}</strong>
                  <span className="text-slate-500 dark:text-slate-400">{property.adresse}</span>
                </div>
                <div className="property-meta">
                  <strong className="text-slate-800 dark:text-slate-200">{parseFloat(property.prix || property.loyer_mensuel || '0').toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} Ariary</strong>
                  <span className={`mini-status ${property.statut === 'LOUE' ? 'green dark:text-emerald-400' : property.statut === 'RESERVE' ? 'purple dark:text-purple-400' : 'orange dark:text-amber-400'}`}>
                    {property.statut === 'LOUE' ? t("dashboard.common.status_loue", "Loué") : property.statut === 'VENDU' ? t("dashboard.common.status_vendu", "Vendu") : property.statut === 'RESERVE' ? t("dashboard.common.status_reserve", "Réservé") : property.statut === 'EN_TRAVAUX' ? t("dashboard.common.status_en_travaux", "En travaux") : t("dashboard.common.status_disponible", "Disponible")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel notifications-section dark:bg-slate-900/90 dark:border-slate-800">
        <div className="panel-header">
          <div>
            <h2 className="text-slate-900 dark:text-white">{t("dashboard.proprietaire.notifications_title", "Notifications récentes")}</h2>
            <p className="text-slate-500 dark:text-slate-400">{t("dashboard.proprietaire.notifications_sub", "Les informations importantes concernant vos biens")}</p>
          </div>
          <button className="outline-button dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" onClick={() => setNotificationsOpen(true)}>
            {t("dashboard.common.view_all", "Tout afficher")} <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="notification-row">
          {notificationsList.length > 0 ? (
            notificationsList.slice(0, 3).map((item) => (
              <article className="notification-card dark:bg-slate-900 dark:border-slate-800" key={item.id}>
                <div className={`notification-icon blue dark:bg-blue-900/40 dark:text-blue-400`}><CircleAlert size={17} /></div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">{item.titre || item.type_display}</strong>
                  <p className="text-slate-500 dark:text-slate-400">{item.message}</p>
                  <small className="text-slate-400 dark:text-slate-500">{item.date_creation ? new Date(item.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR') : ''}</small>
                </div>
              </article>
            ))
          ) : (
            <p style={{ fontSize: '11px', padding: '10px 0' }} className="text-slate-400 dark:text-slate-500">Aucune notification récente.</p>
          )}
        </div>
      </section>
    </>
  )
}
