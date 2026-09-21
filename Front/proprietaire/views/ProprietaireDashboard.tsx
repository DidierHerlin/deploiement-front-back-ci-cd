'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { deconnecter } from '@/lib/auth'
import { getProfil } from '@/lib/api'
import {
  Bell, Building2, CalendarDays, ChevronDown, ChevronRight, CircleDollarSign,
  FileText, Home, LayoutDashboard, Menu, MoreHorizontal, Search, Settings,
  UserRound, WalletCards, X, ArrowUpRight, CircleAlert, Download, Eye,
  CheckCircle2, Clock3,
} from 'lucide-react'

// ... (navItems, properties, payments, notifications omitted for brevity but I need to keep them)

const navItems = [
  { label: 'Vue d’ensemble', icon: LayoutDashboard },
  { label: 'Mes biens', icon: Building2 },
  { label: 'Mes contrats', icon: FileText },
  { label: 'Mes paiements', icon: WalletCards },
]

const properties = [
  { name: 'Résidence Les Jardins', address: '12 rue des Lilas, Paris 15e', type: 'Appartement · Lot 12', rent: '1 250 Ar', status: 'Loué', tenant: 'Sophie Martin', color: 'blue' },
  { name: 'Villa des Oliviers', address: '8 avenue Victor Hugo, Nice', type: 'Maison · 5 pièces', rent: '2 100 Ar', status: 'Loué', tenant: 'Thomas Bernard', color: 'green' },
  { name: 'Le Patio Central', address: '24 boulevard Haussmann, Paris 9e', type: 'Studio · Lot 04', rent: '890 Ar', status: 'Disponible', tenant: 'À relouer', color: 'orange' },
]

const payments = [
  { tenant: 'Sophie Martin', property: 'Résidence Les Jardins', amount: '1 250 Ar', date: 'Aujourd’hui', status: 'Payé', initials: 'SM' },
  { tenant: 'Thomas Bernard', property: 'Villa des Oliviers', amount: '2 100 Ar', date: 'Hier', status: 'Payé', initials: 'TB' },
  { tenant: 'Sophie Martin', property: 'Résidence Les Jardins', amount: '1 250 Ar', date: '05 juin 2024', status: 'Payé', initials: 'SM' },
]

const notifications = [
  { icon: CircleAlert, tone: 'red', title: 'Révision de loyer à valider', text: 'Le contrat du Patio Central arrive à échéance le 22 juillet.', time: 'Il y a 2 h' },
  { icon: FileText, tone: 'blue', title: 'Nouveau compte-rendu disponible', text: 'Le gestionnaire a ajouté un document pour Villa des Oliviers.', time: 'Hier' },
  { icon: CheckCircle2, tone: 'green', title: 'Loyer encaissé', text: 'Le paiement de Sophie Martin a bien été enregistré.', time: 'Hier' },
]

import { StatCard } from '@/proprietaire/components/StatCard'
import '../styles/dashboard.css'
import { getBiens, BienListItem, getPaiements, Paiement, getNotifications, getEcheances, Notification } from '@/lib/api'

export function ProprietaireDashboard() {
  const [active, setActive] = useState('Vue d’ensemble')
  const [mobileNav, setMobileNav] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAllPayments, setShowAllPayments] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  
  const [biensList, setBiensList] = useState<BienListItem[]>([])
  const [paiementsList, setPaiementsList] = useState<Paiement[]>([])
  const [notificationsList, setNotificationsList] = useState<Notification[]>([])
  const [echeancesList, setEcheancesList] = useState<any[]>([])

  useEffect(() => {
    getProfil()
      .then(profil => {
        setUserName(profil.prenoms || profil.nom || 'Propriétaire')
      })
      .catch(err => {
        console.error("Erreur chargement profil", err)
        setUserName('') // fallback silencieux
      })

    getBiens()
      .then(data => {
        setBiensList(data || [])
      })
      .catch(err => {
        console.error("Erreur chargement biens", err)
      })

    getPaiements()
      .then(data => {
        setPaiementsList(data || [])
      })
      .catch(err => {
        console.error("Erreur chargement paiements", err)
      })

    getNotifications()
      .then(data => {
        if (Array.isArray(data)) setNotificationsList(data)
      })
      .catch(err => console.error("Erreur chargement notifications", err))

    getEcheances()
      .then(data => {
        setEcheancesList(data || [])
      })
      .catch(err => console.error("Erreur chargement echeances", err))
  }, [])

  const filtered = biensList.filter((item) => `${item.titre} ${item.adresse}`.toLowerCase().includes(query.toLowerCase()))
  
  // Remplacer les faux paiements de la table par les vrais
  const validPaiements = paiementsList.filter(p => p.statut === 'PAYE' || p.statut === 'EN_RETARD')
  const visiblePayments = showAllPayments ? validPaiements : validPaiements.slice(0, 3)

  const totalBiens = biensList.length
  const loues = biensList.filter(b => b.statut === 'LOUE').length
  const vendus = biensList.filter(b => b.statut === 'VENDU').length
  const disponibles = biensList.filter(b => b.statut === 'DISPONIBLE').length

  const biensDetail = []
  if (loues > 0) biensDetail.push(`${loues} loué${loues > 1 ? 's' : ''}`)
  if (vendus > 0) biensDetail.push(`${vendus} vendu${vendus > 1 ? 's' : ''}`)
  if (disponibles > 0) biensDetail.push(`${disponibles} disponible${disponibles > 1 ? 's' : ''}`)

  const biensDetailStr = biensDetail.length > 0 ? biensDetail.join(' · ') : 'Aucun bien enregistré'

  const tauxOccupation = totalBiens > 0 ? Math.round((loues / totalBiens) * 100) : 0
  const tauxDetailStr = totalBiens > 0 ? `${loues} bien${loues > 1 ? 's' : ''} sur ${totalBiens} occupé${loues > 1 ? 's' : ''}` : "Aucun bien à occuper"

  // Calculs Revenus
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  let revenuCeMois = 0
  let revenuMoisDernier = 0

  paiementsList.forEach(p => {
    if (p.statut === 'PAYE' && p.date_paiement) {
      const d = new Date(p.date_paiement)
      const amt = parseFloat(p.montant_paye as string) || parseFloat(p.montant as string) || parseFloat(p.montant_attendu as string) || 0
      
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        revenuCeMois += amt
      } else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        revenuMoisDernier += amt
      }
    }
  })

  let evolutionText = "stable vs mois dernier"
  if (revenuMoisDernier > 0) {
    const pourcentageEvolution = ((revenuCeMois - revenuMoisDernier) / revenuMoisDernier) * 100
    const sign = pourcentageEvolution > 0 ? '+' : ''
    evolutionText = `${sign}${pourcentageEvolution.toFixed(1).replace('.', ',')}% vs mois dernier`
  } else if (revenuCeMois > 0) {
    evolutionText = "+100% vs mois dernier"
  } else {
    evolutionText = "Aucun revenu ce mois-ci"
  }

  return (
    <>
      <div className="welcome-row"><div><p className="eyebrow">MARDI 02 JUILLET 2024</p><h1>Bonjour{userName ? ` ${userName}` : ''}, <span>voici votre patrimoine.</span></h1><p className="subtitle">Suivez vos biens, vos revenus et les événements importants en un coup d’œil.</p></div><button className="outline-button download-button"><Download size={16} />Exporter mes données</button></div>
      <div className="owner-banner"><div className="banner-icon"><Home size={19} /></div><div><strong>Bienvenue dans votre espace propriétaire</strong><p>Votre agence Horizon gère {totalBiens} bien{totalBiens > 1 ? 's' : ''} pour vous. Les informations affichées concernent uniquement votre patrimoine.</p></div><ChevronRight size={18} /></div>
      <section className="stats-grid"><StatCard icon={Building2} label="Mes biens" value={totalBiens.toString()} detail={biensDetailStr} tone="blue" /><StatCard icon={CircleDollarSign} label="Revenus mensuels" value={`${revenuCeMois.toLocaleString('fr-FR')} Ar`} detail={evolutionText} tone="green" /><StatCard icon={WalletCards} label="Taux d’occupation" value={`${tauxOccupation}%`} detail={tauxDetailStr} tone="orange" /><StatCard icon={CalendarDays} label="Prochaine échéance" value="05 juil." detail="2 loyers attendus" tone="red" /></section>
      <div className="content-grid">
        <section className="panel revenue-panel">
          <div className="panel-header"><div><h2>Mes revenus locatifs</h2><p>Évolution des encaissements sur les 6 derniers mois</p></div><button className="select-button">6 derniers mois <ChevronDown size={14} /></button></div>
          <div className="chart"><div className="chart-y"><span>4k</span><span>3k</span><span>2k</span><span>0</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 600 205" preserveAspectRatio="none" aria-label="Graphique de mes revenus"><defs><linearGradient id="ownerChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity=".22" /><stop offset="1" stopColor="var(--primary)" stopOpacity="0" /></linearGradient></defs><path d="M0 155 C40 150 60 120 110 130 S160 105 205 120 S260 75 300 88 S350 105 395 72 S450 65 485 42 S535 58 600 22 L600 205 L0 205Z" fill="url(#ownerChartFill)" /><path d="M0 155 C40 150 60 120 110 130 S160 105 205 120 S260 75 300 88 S350 105 395 72 S450 65 485 42 S535 58 600 22" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" /></svg><div className="chart-labels"><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span></div></div></div>
        </section>
        <section className="panel deadlines-panel">
          <div className="panel-header"><div><h2>Événements à venir</h2><p>Les prochaines échéances de vos biens</p></div><button className="more-button" aria-label="Plus d’options"><MoreHorizontal size={20} /></button></div>
          <div className="deadline-list">
            {echeancesList.length > 0 ? (
              echeancesList.slice(0, 3).map((e: any, idx) => {
                const dateObj = e.date_echeance ? new Date(e.date_echeance) : new Date();
                const day = dateObj.getDate().toString().padStart(2, '0');
                const month = dateObj.toLocaleString('fr-FR', { month: 'short' }).toUpperCase();
                return (
                  <div className="deadline" key={idx}>
                    <div className="date-block"><strong>{day}</strong><span>{month}</span></div>
                    <div><strong>Loyer attendu</strong><p>{e.bien_titre} · {parseFloat(e.montant_attendu).toLocaleString('fr-FR')} Ar</p></div>
                    <ChevronRight size={17} />
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '11px', color: '#687386', padding: '10px 0' }}>Aucun événement à venir.</p>
            )}
          </div>
          <button className="link-button">Voir mon calendrier <ArrowUpRight size={15} /></button>
        </section>
      </div>
      <div className="lower-grid"><section className="panel"><div className="panel-header"><div><h2>Historique des paiements</h2><p>Les derniers encaissements de vos biens</p></div><Link href="/proprietaire/paiements" className="outline-button">Tout voir <ArrowUpRight size={15} /></Link></div><div className="table-wrap"><table><thead><tr><th>LOCATAIRE</th><th>BIEN</th><th>MONTANT</th><th>DATE</th><th>STATUT</th></tr></thead><tbody>{visiblePayments.map((payment) => <tr key={payment.id}><td><div className="tenant"><span>{(payment.locataire_nom || 'XX').substring(0, 2).toUpperCase()}</span><strong>{payment.locataire_nom || 'Inconnu'}</strong></div></td><td>{payment.bien_titre}</td><td><strong>{(parseFloat(payment.montant_paye as string) || parseFloat(payment.montant as string) || parseFloat(payment.montant_attendu as string) || 0).toLocaleString('fr-FR')} Ar</strong></td><td>{payment.date_paiement ? new Date(payment.date_paiement).toLocaleDateString('fr-FR') : '-'}</td><td><span className={`status ${payment.statut === 'PAYE' ? 'paid' : 'late'}`}>{payment.statut === 'PAYE' ? 'Payé' : 'En retard'}</span></td></tr>)}</tbody></table></div></section><section className="panel properties-panel"><div className="panel-header"><div><h2>Mes biens immobiliers</h2><p>La situation actuelle de votre parc</p></div><Link href="/proprietaire/biens" className="outline-button">Tout voir <ArrowUpRight size={15} /></Link></div><div className="property-list">{filtered.slice(0, 3).map((property) => <div className="property" key={property.id}><div className={`property-icon ${property.statut === 'LOUE' ? 'blue' : property.statut === 'DISPONIBLE' ? 'orange' : 'green'}`}><Building2 size={18} /></div><div className="property-info"><strong>{property.titre}</strong><span>{property.adresse}</span></div><div className="property-meta"><strong>{parseFloat(property.prix || property.loyer_mensuel || '0').toLocaleString('fr-FR')} Ar</strong><span className={`mini-status ${property.statut === 'LOUE' ? 'green' : property.statut === 'RESERVE' ? 'purple' : 'orange'}`}>{property.statut === 'LOUE' ? 'Loué' : property.statut === 'VENDU' ? 'Vendu' : property.statut === 'RESERVE' ? 'Réservé' : property.statut === 'EN_TRAVAUX' ? 'En travaux' : 'Disponible'}</span></div></div>)}</div></section></div>
      <section className="panel notifications-section">
        <div className="panel-header"><div><h2>Notifications récentes</h2><p>Les informations importantes concernant vos biens</p></div><button className="outline-button" onClick={() => setNotificationsOpen(true)}>Tout afficher <ArrowUpRight size={15} /></button></div>
        <div className="notification-row">
          {notificationsList.length > 0 ? (
            notificationsList.slice(0, 3).map((item) => (
              <article className="notification-card" key={item.id}>
                <div className={`notification-icon blue`}><CircleAlert size={17} /></div>
                <div><strong>{item.titre || item.type_display}</strong><p>{item.message}</p><small>{item.date_creation ? new Date(item.date_creation).toLocaleDateString('fr-FR') : ''}</small></div>
              </article>
            ))
          ) : (
            <p style={{ fontSize: '11px', color: '#687386', padding: '10px 0' }}>Aucune notification récente.</p>
          )}
        </div>
      </section>
    </>
  )
}
