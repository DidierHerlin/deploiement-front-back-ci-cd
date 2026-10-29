'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  Filter,
  CreditCard,
  FileText,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  MailCheck
} from 'lucide-react'
import { getNotifications, markNotificationsAsRead, Notification } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface NotificationsPageViewProps {
  role?: 'LOCATAIRE' | 'PROPRIETAIRE' | string
  userType?: string
}

type FilterType = 'ALL' | 'UNREAD' | 'FINANCE' | 'CONTRAT'

export function NotificationsPageView({ role = 'LOCATAIRE', userType }: NotificationsPageViewProps) {
  const { t, lang } = useTranslation()
  const router = useRouter()

  const normalizedRole = (userType || role || '').toString().trim().toUpperCase()
  const isLocataire =
    normalizedRole === 'LOCATAIRE' ||
    normalizedRole.includes('LOCATAIRE') ||
    normalizedRole.includes('TENANT')
  const isProprietaire = !isLocataire

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const fetchNotifs = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      const data = await getNotifications()
      setNotifications(data || [])
    } catch (err: any) {
      setError(err?.message || t('notifications.load_error', 'Erreur lors du chargement des notifications.'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNotifs()
  }, [])

  const isFinance = (type: string) => {
    const tLower = (type || '').toLowerCase()
    return (
      tLower.includes('echeance') ||
      tLower.includes('paiement') ||
      tLower.includes('loyer') ||
      tLower.includes('quittance') ||
      tLower.includes('finance')
    )
  }

  const isContrat = (type: string) => {
    const tLower = (type || '').toLowerCase()
    return (
      tLower.includes('contrat') ||
      tLower.includes('bail') ||
      tLower.includes('reservation') ||
      tLower.includes('bien')
    )
  }

  const stats = useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter((n) => !n.lu).length
    const finance = notifications.filter((n) => isFinance(n.type)).length
    const contrat = notifications.filter((n) => isContrat(n.type)).length
    return { total, unread, finance, contrat }
  }, [notifications])

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Filter tab
      if (activeFilter === 'UNREAD' && item.lu) return false
      if (activeFilter === 'FINANCE' && !isFinance(item.type)) return false
      if (activeFilter === 'CONTRAT' && !isContrat(item.type)) return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = (item.titre || '').toLowerCase().includes(query)
        const matchMsg = (item.message || '').toLowerCase().includes(query)
        const matchType = (item.type_display || item.type || '').toLowerCase().includes(query)
        if (!matchTitle && !matchMsg && !matchType) return false
      }

      return true
    })
  }, [notifications, activeFilter, searchQuery])

  const handleMarkAllAsRead = async () => {
    if (stats.unread === 0) return
    try {
      await markNotificationsAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
      toast.success(t('notifications.all_marked_success', 'Toutes les notifications sont marquées comme lues.'))
    } catch (err: any) {
      toast.error(err?.message || t('notifications.mark_error', 'Échec de la mise à jour des notifications.'))
    }
  }

  const handleMarkOneAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setActionLoadingId(id)
      await markNotificationsAsRead([id])
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)))
      toast.success(t('notifications.marked_one_success', 'Notification marquée comme lue.'))
    } catch (err: any) {
      toast.error(err?.message || t('notifications.mark_error', 'Erreur lors de la mise à jour.'))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleNavigateOrDownload = (item: Notification) => {
    if (!item.lu) {
      handleMarkOneAsRead(item.id)
    }

    try {
      const typeLower = (item.type || '').toLowerCase()
      const lienLower = (item.lien || '').toLowerCase()
      const titreLower = (item.titre || '').toLowerCase()
      const messageLower = (item.message || '').toLowerCase()

      // Détection des notifications de quittance, paiement, loyer ou échéance
      const isQuittanceOrPaiement =
        isFinance(item.type) ||
        typeLower.includes('quittance') ||
        typeLower.includes('paiement') ||
        typeLower.includes('echeance') ||
        typeLower.includes('loyer') ||
        lienLower.includes('quittance') ||
        lienLower.includes('paiement') ||
        titreLower.includes('quittance') ||
        titreLower.includes('paiement') ||
        titreLower.includes('loyer') ||
        messageLower.includes('quittance')

      if (isQuittanceOrPaiement) {
        if (isLocataire) {
          router.push('/espace-locataire/quittances')
        } else {
          router.push('/espace-proprietaire/paiements')
        }
        return
      }

      // Détection des contrats et baux
      const isContratEvent =
        isContrat(item.type) ||
        typeLower.includes('contrat') ||
        typeLower.includes('bail') ||
        lienLower.includes('contrat') ||
        titreLower.includes('contrat') ||
        titreLower.includes('bail')

      if (isContratEvent) {
        if (isLocataire) {
          router.push('/espace-locataire/contrat')
        } else {
          router.push('/espace-proprietaire/contrats')
        }
        return
      }

      // Détection des biens
      if (typeLower.includes('bien') || lienLower.includes('bien') || titreLower.includes('bien')) {
        if (isLocataire) {
          router.push('/espace-locataire/biens')
        } else {
          router.push('/espace-proprietaire/biens')
        }
        return
      }

      // Si un lien spécifique est présent
      if (item.lien) {
        let target = item.lien
        // Si le lien commence par /api/, on ne tente aucun appel fetchBlob direct depuis le centre de notifications
        if (target.startsWith('/api/')) {
          if (target.includes('quittance') || target.includes('paiement')) {
            router.push(isLocataire ? '/espace-locataire/quittances' : '/espace-proprietaire/paiements')
            return
          }
          if (target.includes('contrat')) {
            router.push(isLocataire ? '/espace-locataire/contrat' : '/espace-proprietaire/contrats')
            return
          }
          router.push(isLocataire ? '/espace-locataire/quittances' : '/espace-proprietaire/paiements')
          return
        }

        // Redirection vers routes propres de l'application
        if (isLocataire) {
          if (target.startsWith('/contrats/')) target = '/espace-locataire/contrat'
          else if (target.startsWith('/paiements/')) target = '/espace-locataire/quittances'
          else if (target.startsWith('/locataire/')) target = target.replace('/locataire/', '/espace-locataire/')
        } else {
          if (target.startsWith('/contrats/')) target = '/espace-proprietaire/contrats'
          else if (target.startsWith('/paiements/')) target = '/espace-proprietaire/paiements'
          else if (target.startsWith('/biens/')) target = '/espace-proprietaire/biens'
          else if (target.startsWith('/proprietaire/')) target = target.replace('/proprietaire/', '/espace-proprietaire/')
        }
        router.push(target)
        return
      }

      // Fallback sécurisé par défaut selon le rôle
      if (isLocataire) {
        router.push('/espace-locataire/quittances')
      } else {
        router.push('/espace-proprietaire/paiements')
      }
    } catch (err) {
      console.warn('Navigation impossible pour cette notification :', err)
      if (isLocataire) {
        router.push('/espace-locataire/quittances')
      } else {
        router.push('/espace-proprietaire/paiements')
      }
    }
  }

  const getNotificationBadge = (type: string) => {
    const tLower = (type || '').toLowerCase()
    if (tLower.includes('echeance') || tLower.includes('loyer_impaye')) {
      return {
        icon: AlertTriangle,
        label: t('notifications.type_echeance', 'Échéance'),
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
        iconClass: 'text-amber-600 dark:text-amber-400',
        bgIcon: 'bg-amber-50 dark:bg-amber-950/40'
      }
    }
    if (tLower.includes('paiement')) {
      return {
        icon: CheckCircle2,
        label: t('notifications.type_paiement', 'Paiement'),
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
        iconClass: 'text-emerald-600 dark:text-emerald-400',
        bgIcon: 'bg-emerald-50 dark:bg-emerald-950/40'
      }
    }
    if (tLower.includes('contrat') || tLower.includes('bail')) {
      return {
        icon: FileText,
        label: t('notifications.type_contrat', 'Contrat & Bail'),
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
        iconClass: 'text-purple-600 dark:text-purple-400',
        bgIcon: 'bg-purple-50 dark:bg-purple-950/40'
      }
    }
    return {
      icon: Info,
      label: t('notifications.type_info', 'Information'),
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
      iconClass: 'text-blue-600 dark:text-blue-400',
      bgIcon: 'bg-blue-50 dark:bg-blue-950/40'
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
            {isLocataire
              ? t('notifications.tenant_eyebrow', 'ESPACE LOCATAIRE • ALERTES')
              : t('notifications.owner_eyebrow', 'ESPACE PROPRIÉTAIRE • ALERTES')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {t('notifications.page_title', 'Centre de notifications')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('notifications.page_subtitle', 'Consultez l’historique en temps réel de vos avis d’échéances, paiements et contrats.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchNotifs(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            title={t('common.refresh', 'Actualiser')}
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Actualiser')}</span>
          </button>

          <button
            onClick={handleMarkAllAsRead}
            disabled={stats.unread === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer disabled:cursor-not-allowed"
          >
            <CheckCheck className="size-4" />
            <span>{t('notifications.mark_all_read', 'Tout marquer comme lu')}</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div
          onClick={() => setActiveFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('notifications.filter_all', 'Toutes les alertes')}
            </span>
            <div className="size-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.total}</div>
        </div>

        {/* Non lues */}
        <div
          onClick={() => setActiveFilter('UNREAD')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'UNREAD'
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('notifications.filter_unread', 'Non lues')}
            </span>
            <div className="size-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats.unread}</div>
        </div>

        {/* Échéances & Paiements */}
        <div
          onClick={() => setActiveFilter('FINANCE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'FINANCE'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('notifications.filter_finance', 'Échéances & Paiements')}
            </span>
            <div className="size-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.finance}</div>
        </div>

        {/* Baux & Contrats */}
        <div
          onClick={() => setActiveFilter('CONTRAT')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'CONTRAT'
              ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('notifications.filter_contrats', 'Baux & Contrats')}
            </span>
            <div className="size-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.contrat}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t('notifications.tab_all', 'Toutes')} ({stats.total})
          </button>

          <button
            onClick={() => setActiveFilter('UNREAD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'UNREAD'
                ? 'bg-amber-500 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{t('notifications.tab_unread', 'Non lues')}</span>
            {stats.unread > 0 && (
              <span className={`size-4 rounded-full text-[10px] flex items-center justify-center ${activeFilter === 'UNREAD' ? 'bg-white text-amber-700' : 'bg-amber-500 text-white font-bold'}`}>
                {stats.unread}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFilter('FINANCE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeFilter === 'FINANCE'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t('notifications.tab_finance', 'Échéances & Paiements')} ({stats.finance})
          </button>

          <button
            onClick={() => setActiveFilter('CONTRAT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeFilter === 'CONTRAT'
                ? 'bg-purple-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t('notifications.tab_contrats', 'Baux & Contrats')} ({stats.contrat})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px] md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('notifications.search_placeholder', 'Filtrer les alertes...')}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Loader2 className="size-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('notifications.loading', 'Chargement de vos notifications...')}
            </p>
          </div>
        ) : error ? (
          <div className="py-12 px-4 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <AlertTriangle className="size-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</h3>
            <button
              onClick={() => fetchNotifs()}
              className="mt-3 px-4 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              {t('common.retry', 'Réessayer')}
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <MailCheck className="size-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {notifications.length === 0
                ? t('notifications.empty_title', 'Aucune notification pour le moment')
                : t('notifications.no_filter_match', 'Aucun résultat correspondant')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              {notifications.length === 0
                ? t('notifications.empty_desc', 'Vous recevrez ici toutes vos alertes d’échéances de loyer, confirmations de paiement et documents légaux.')
                : t('notifications.no_filter_match_desc', 'Essayez de modifier votre filtre ou de réinitialiser votre recherche par mot-clé.')}
            </p>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  setActiveFilter('ALL')
                  setSearchQuery('')
                }}
                className="mt-4 px-4 py-1.5 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t('notifications.reset_filters', 'Réinitialiser les filtres')}
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const badge = getNotificationBadge(item.type)
            const BadgeIcon = badge.icon
            const isUnread = !item.lu

            return (
              <div
                key={item.id}
                onClick={() => handleNavigateOrDownload(item)}
                className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  isUnread
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Left Icon with subtle glow */}
                  <div className="flex items-center gap-3 sm:block">
                    <div
                      className={`size-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${badge.bgIcon} ${badge.iconClass} border border-slate-200/60 dark:border-slate-700/40`}
                    >
                      <BadgeIcon className="size-5" />
                    </div>

                    {/* Mobile Badge and Unread Dot */}
                    <div className="sm:hidden flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.badgeClass}`}>
                        {badge.label}
                      </span>
                      {isUnread && (
                        <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.titre || item.type_display || item.type}
                        </h4>
                        {isUnread && (
                          <span className="hidden sm:inline-block size-2 rounded-full bg-blue-600 animate-pulse" />
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>
                          {new Date(item.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                      {item.message}
                    </p>

                    {/* Bottom Actions */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        {item.lien || isFinance(item.type) || isContrat(item.type) ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                            <span>{t('notifications.view_details', 'Consulter le détail')}</span>
                            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {t('notifications.info_only', 'Notification informative')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkOneAsRead(item.id, e)}
                            disabled={actionLoadingId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            {actionLoadingId === item.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3" />
                            )}
                            <span>{t('notifications.mark_as_read', 'Marquer comme lu')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
