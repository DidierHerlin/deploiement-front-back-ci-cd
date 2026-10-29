'use client'

import React, { useState, useEffect } from 'react'
import {
  User,
  ShieldCheck,
  BellRing,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  Mail,
  MessageSquare,
  Sparkles,
  Smartphone,
  Save,
  Sliders,
  Languages,
  Loader2,
  Lock,
  Globe
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslation, Language } from '@/lib/i18n'
import { getProfil, UserProfil } from '@/lib/api'
import ProfilForm from '@/components/organisms/ProfilForm'
import { toast } from 'sonner'

interface ParametresPageViewProps {
  role: 'LOCATAIRE' | 'PROPRIETAIRE'
}

type TabType = 'PROFILE' | 'NOTIFICATIONS' | 'APPEARANCE'

interface NotificationPrefs {
  emailEcheances: boolean
  emailPaiements: boolean
  emailContrats: boolean
  emailRecapMensuel: boolean
  smsEcheances: boolean
  smsMobileMoney: boolean
  inAppAlerts: boolean
}

export function ParametresPageView({ role }: ParametresPageViewProps) {
  const { theme, setTheme, systemTheme } = useTheme()
  const { t, lang, setLang } = useTranslation()

  const [activeTab, setActiveTab] = useState<TabType>('PROFILE')
  const [mounted, setMounted] = useState(false)

  // Profile data
  const [profil, setProfil] = useState<UserProfil | null>(null)
  const [loadingProfil, setLoadingProfil] = useState(true)
  const [profilError, setProfilError] = useState<string | null>(null)

  // Notification preferences
  const storageKey = `immoconnect_notification_prefs_${role.toLowerCase()}`
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    emailEcheances: true,
    emailPaiements: true,
    emailContrats: true,
    emailRecapMensuel: false,
    smsEcheances: true,
    smsMobileMoney: true,
    inAppAlerts: true
  })

  useEffect(() => {
    setMounted(true)

    // Load profile
    getProfil()
      .then((data) => setProfil(data))
      .catch((err) => {
        setProfilError(err?.message || t('settings.profile_load_error', 'Impossible de charger les données du profil.'))
      })
      .finally(() => setLoadingProfil(false))

    // Load notification preferences from localStorage
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setNotifPrefs((prev) => ({ ...prev, ...JSON.parse(saved) }))
      }
    } catch {
      // Ignore JSON error
    }
  }, [storageKey, t])

  const handleTogglePref = (key: keyof NotificationPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(updated)
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
      toast.success(t('settings.prefs_saved', 'Vos préférences de notification ont été mises à jour.'))
    } catch {
      toast.error(t('settings.prefs_save_error', 'Erreur lors de la sauvegarde locale.'))
    }
  }

  const handleSelectTheme = (newTheme: string) => {
    setTheme(newTheme)
    const label =
      newTheme === 'dark'
        ? t('settings.theme_dark_title', 'Sombre')
        : newTheme === 'light'
        ? t('settings.theme_light_title', 'Clair')
        : t('settings.theme_system_title', 'Système')
    toast.success(`${t('settings.theme_section_title', 'Thème')} : ${label}`)
  }

  const handleSelectLanguage = (newLang: Language) => {
    setLang(newLang)
    const label = newLang === 'fr' ? 'Français' : 'English'
    toast.success(`${t('settings.lang_section_title', 'Langue')} : ${label}`)
  }

  const themeOptions = [
    {
      id: 'light',
      title: t('settings.theme_light_title', 'Clair (Normal)'),
      desc: t('settings.theme_light_desc', 'Affichage lumineux adapté aux environnements éclairés.'),
      icon: Sun,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600',
      previewBg: 'bg-slate-100'
    },
    {
      id: 'dark',
      title: t('settings.theme_dark_title', 'Sombre (Dark)'),
      desc: t('settings.theme_dark_desc', 'Interface sombre pour préserver vos yeux et économiser de l’énergie.'),
      icon: Moon,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-400',
      previewBg: 'bg-slate-900'
    },
    {
      id: 'system',
      title: t('settings.theme_system_title', 'Système (Auto)'),
      desc: t('settings.theme_system_desc', 'S’aligne en permanence sur les réglages de votre appareil.'),
      icon: Laptop,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-950/40 text-blue-500',
      previewBg: 'bg-gradient-to-r from-slate-100 to-slate-900'
    }
  ]

  const languageOptions = [
    {
      code: 'fr' as Language,
      label: 'Français',
      native: 'Français (France)',
      flag: '🇫🇷',
      desc: t('settings.lang_fr_desc', 'Langue par défaut de la plateforme ImmoConnect.')
    },
    {
      code: 'en' as Language,
      label: 'English',
      native: 'English (United States)',
      flag: '🇬🇧',
      desc: t('settings.lang_en_desc', 'Interface translated into English with international formatting.')
    }
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2">
        <span className="text-xs font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
          {role === 'LOCATAIRE'
            ? t('settings.tenant_eyebrow', 'ESPACE LOCATAIRE • CONFIGURATION')
            : t('settings.owner_eyebrow', 'ESPACE PROPRIÉTAIRE • CONFIGURATION')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          {t('settings.page_title', 'Paramètres du compte')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('settings.page_subtitle', 'Personnalisez vos informations personnelles, vos canaux d’alerte et le mode d’affichage.')}
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <User className="size-4" />
          <span>{t('settings.tab_profile', 'Profil & Sécurité')}</span>
        </button>

        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <BellRing className="size-4" />
          <span>{t('settings.tab_notifications', 'Préférences d’alertes')}</span>
        </button>

        <button
          onClick={() => setActiveTab('APPEARANCE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'APPEARANCE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <Palette className="size-4" />
          <span>{t('settings.tab_appearance', 'Apparence & Langue')}</span>
        </button>
      </div>

      {/* Tab 1: Profile & Security */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="size-5 text-blue-600 dark:text-blue-400" />
                <span>{t('settings.profile_section_title', 'Informations personnelles & Mot de passe')}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('settings.profile_section_desc', 'Modifiez vos coordonnées, votre photo de profil ou changez votre mot de passe en toute sécurité.')}
              </p>
            </div>

            {loadingProfil ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loader2 className="size-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('settings.loading_profile', 'Chargement de vos informations...')}
                </p>
              </div>
            ) : profilError ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 text-sm">
                {profilError}
              </div>
            ) : profil ? (
              <ProfilForm
                initialData={profil}
                onUpdate={(updated) => {
                  setProfil(updated)
                  toast.success(t('settings.profile_updated', 'Profil mis à jour avec succès.'))
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Tab 2: Notification Preferences */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="space-y-6">
          {/* Email Notifications Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Mail className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('settings.notif_email_title', 'Notifications par Email')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.notif_email_desc', 'Choisissez les messages que vous souhaitez recevoir dans votre boîte de réception.')}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Email Echeances */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t('settings.notif_email_echeances', 'Avis d’échéances et rappels de loyer')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('settings.notif_email_echeances_desc', 'Recevez un email 5 jours avant la date limite de règlement de votre terme.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('emailEcheances')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifPrefs.emailEcheances ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifPrefs.emailEcheances ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email Paiements */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t('settings.notif_email_paiements', 'Confirmations de paiements & Quittances officielles')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('settings.notif_email_paiements_desc', 'Recevez votre quittance au format PDF sécurisé dès encaissement validé.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('emailPaiements')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifPrefs.emailPaiements ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifPrefs.emailPaiements ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email Contrats */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t('settings.notif_email_contrats', 'Événements contractuels & Baux')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('settings.notif_email_contrats_desc', 'Signature de contrat, renouvellement ou modification de dossier.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('emailContrats')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifPrefs.emailContrats ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifPrefs.emailContrats ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email Recap */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t('settings.notif_email_recap', 'Récapitulatif mensuel d’activité')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('settings.notif_email_recap_desc', 'Un compte-rendu synthétique de vos opérations envoyé chaque début de mois.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('emailRecapMensuel')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifPrefs.emailRecapMensuel ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifPrefs.emailRecapMensuel ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SMS & Mobile Money Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Smartphone className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('settings.notif_sms_title', 'Alertes SMS & Mobile Money')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.notif_sms_desc', 'Notifications directes par SMS sur votre numéro vérifié.')}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* SMS Echeances */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t('settings.notif_sms_echeances', 'Rappels critiques par SMS')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('settings.notif_sms_echeances_desc', 'SMS d’alerte 48h avant la clôture d’une échéance prioritaire.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('smsEcheances')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifPrefs.smsEcheances ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifPrefs.smsEcheances ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Mobile Money */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t('settings.notif_sms_mobile_money', 'Accusé de réception Mobile Money (Mvola, Airtel, Orange)')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('settings.notif_sms_mobile_money_desc', 'Notification SMS instantanée confirmant la bonne réception de la référence de transaction.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('smsMobileMoney')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifPrefs.smsMobileMoney ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifPrefs.smsMobileMoney ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* In App Alerts */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t('settings.notif_in_app', 'Badges et popovers en direct sur l’application')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('settings.notif_in_app_desc', 'Indicateur visuel rouge et volet déroulant sur la cloche de navigation.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('inAppAlerts')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifPrefs.inAppAlerts ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifPrefs.inAppAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Appearance & Language */}
      {activeTab === 'APPEARANCE' && (
        <div className="space-y-6">
          {/* Theme card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Palette className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('settings.theme_section_title', 'Mode d’affichage (Thème)')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.theme_section_desc', 'Choisissez l’ambiance visuelle la plus confortable pour votre utilisation.')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((opt) => {
                const isSelected = mounted && theme === opt.id
                const Icon = opt.icon

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectTheme(opt.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${opt.bgColor}`}>
                          <Icon className="size-5" />
                        </div>
                        {isSelected && (
                          <div className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                            <Check className="size-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{opt.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>

                    {opt.id === 'system' && mounted && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        {t('settings.system_detected', 'Détecté')} : {systemTheme === 'dark' ? 'Sombre' : 'Clair'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Language card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Globe className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('settings.lang_section_title', 'Langue de l’interface')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.lang_section_desc', 'Sélectionnez votre langue d’affichage préférée.')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {languageOptions.map((opt) => {
                const isSelected = lang === opt.code

                return (
                  <div
                    key={opt.code}
                    onClick={() => handleSelectLanguage(opt.code)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-3xl" role="img" aria-label={opt.label}>
                        {opt.flag}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{opt.label}</h4>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                            ({opt.native})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                        <Check className="size-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
