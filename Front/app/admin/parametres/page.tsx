'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Laptop, Globe, Check, Sliders, ShieldCheck, Palette, Languages } from 'lucide-react'
import { useTranslation, Language } from '@/lib/i18n'
import { toast } from 'sonner'

export default function ParametresPage() {
  const { theme, setTheme, systemTheme } = useTheme()
  const { t, lang, setLang } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const themeOptions = [
    {
      id: 'light',
      title: t('settings.theme_light_title', 'Clair (Normal)'),
      desc: t('settings.theme_light_desc', 'Force le thème lumineux pour une clarté optimale en journée.'),
      icon: Sun,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800/40',
      preview: {
        bg: 'bg-slate-50',
        sidebar: 'bg-white border-r border-slate-200',
        topbar: 'bg-white border-b border-slate-200',
        card: 'bg-white border border-slate-200',
        text: 'text-slate-800'
      }
    },
    {
      id: 'dark',
      title: t('settings.theme_dark_title', 'Sombre (Dark)'),
      desc: t('settings.theme_dark_desc', 'Force le thème sombre pour réduire la fatigue oculaire et économiser de l’énergie.'),
      icon: Moon,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
      borderColor: 'border-indigo-200 dark:border-indigo-800/40',
      preview: {
        bg: 'bg-slate-950',
        sidebar: 'bg-slate-900 border-r border-slate-800',
        topbar: 'bg-slate-900 border-b border-slate-800',
        card: 'bg-slate-900 border border-slate-800',
        text: 'text-slate-200'
      }
    },
    {
      id: 'system',
      title: t('settings.theme_system_title', 'Système (Auto)'),
      desc: t('settings.theme_system_desc', 'Adapte automatiquement selon les préférences du système d’exploitation (prefers-color-scheme).'),
      icon: Laptop,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800/40',
      preview: {
        bg: 'bg-gradient-to-r from-slate-100 to-slate-900',
        sidebar: 'bg-gradient-to-b from-white to-slate-900 border-r border-slate-300 dark:border-slate-800',
        topbar: 'bg-gradient-to-r from-white to-slate-900 border-b border-slate-300 dark:border-slate-800',
        card: 'bg-gradient-to-r from-white to-slate-900 border border-slate-300 dark:border-slate-800',
        text: 'text-slate-700'
      }
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

  const handleSelectTheme = (newTheme: string) => {
    setTheme(newTheme)
    const label = themeOptions.find(o => o.id === newTheme)?.title || newTheme
    toast.success(`${t('settings.theme_section_title', 'Thème')} : ${label}`)
  }

  const handleSelectLanguage = (newLang: Language) => {
    setLang(newLang)
    const label = newLang === 'fr' ? 'Français' : 'English'
    toast.success(`${t('settings.lang_section_title', 'Langue')} : ${label}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div className="welcome-row" style={{ marginBottom: '6px' }}>
        <div>
          <p className="eyebrow">{t('settings.eyebrow', 'CONFIGURATION SYSTÈME')}</p>
          <h1>{t('settings.title', 'Paramètres')}</h1>
          <p className="subtitle">{t('settings.subtitle', 'Gérez vos préférences d’affichage, le thème et la langue de l’interface d’administration.')}</p>
        </div>
      </div>

      {/* Section 1 : Thème */}
      <div className="panel" style={{ padding: '24px' }}>
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff5ff', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
                <Palette size={18} />
              </div>
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>{t('settings.theme_section_title', 'Mode d’affichage (Thème)')}</h2>
            </div>
            <p style={{ marginTop: '6px' }}>{t('settings.theme_section_desc', 'Choisissez l’apparence visuelle de l’application selon vos préférences.')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {themeOptions.map((opt) => {
            const isSelected = mounted && theme === opt.id
            const Icon = opt.icon
            return (
              <div
                key={opt.id}
                onClick={() => handleSelectTheme(opt.id)}
                style={{
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '18px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(37, 99, 235, 0.04)' : 'var(--card)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.12)' : 'none'
                }}
              >
                {/* En-tête de carte */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center' }} className={opt.bgColor}>
                      <Icon className={`size-5 ${opt.color}`} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', display: 'block', color: 'var(--foreground)' }}>{opt.title}</strong>
                      {opt.id === 'system' && mounted && (
                        <small style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>
                          {t('settings.system_detected', 'Système actuel')} : {systemTheme === 'dark' ? 'Sombre' : 'Clair'}
                        </small>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'white',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                {/* Description */}
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.45 }}>
                  {opt.desc}
                </p>

                {/* Mini mockup d'aperçu d'interface */}
                <div style={{ borderRadius: '8px', padding: '8px', border: '1px solid var(--border)', background: 'var(--background)', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', height: '40px', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }} className={opt.preview.bg}>
                    <div style={{ width: '22%' }} className={opt.preview.sidebar} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: '10px' }} className={opt.preview.topbar} />
                      <div style={{ flex: 1, padding: '4px', display: 'flex', gap: '4px' }}>
                        <div style={{ flex: 1, borderRadius: '3px' }} className={opt.preview.card} />
                        <div style={{ flex: 1, borderRadius: '3px' }} className={opt.preview.card} />
                      </div>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div style={{ position: 'absolute', top: '12px', right: '40px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', background: '#dbeafe', color: '#1e40af' }}>
                      {t('settings.active_badge', 'Actif')}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 2 : Langue */}
      <div className="panel" style={{ padding: '24px' }}>
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eaf8f2', display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
                <Languages size={18} />
              </div>
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>{t('settings.lang_section_title', 'Langue de l’interface (Internationalisation)')}</h2>
            </div>
            <p style={{ marginTop: '6px' }}>{t('settings.lang_section_desc', 'Sélectionnez votre langue d’affichage préférée pour toute la plateforme.')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {languageOptions.map((opt) => {
            const isSelected = lang === opt.code
            return (
              <div
                key={opt.code}
                onClick={() => handleSelectLanguage(opt.code)}
                style={{
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '18px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(37, 99, 235, 0.04)' : 'var(--card)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.12)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>{opt.flag}</span>
                    <div>
                      <strong style={{ fontSize: '14px', display: 'block', color: 'var(--foreground)' }}>{opt.label}</strong>
                      <small style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>{opt.native}</small>
                    </div>
                  </div>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'white',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.45 }}>
                  {opt.desc}
                </p>

                {isSelected && (
                  <div style={{ position: 'absolute', top: '12px', right: '40px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', background: '#dbeafe', color: '#1e40af' }}>
                      {t('settings.active_badge', 'Actif')}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 3 : Résumé et Informations Système */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <ShieldCheck size={20} />
          </div>
          <div className="stat-copy">
            <p>{t('settings.summary_title', 'Persistance locale')}</p>
            <strong>{t('settings.active_badge', 'Actif')} &amp; Synchronisé</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Sliders size={20} />
          </div>
          <div className="stat-copy">
            <p>{t('settings.current_theme', 'Thème en vigueur')}</p>
            <strong style={{ textTransform: 'capitalize' }}>
              {mounted ? (theme === 'system' ? `Système (${systemTheme})` : theme) : 'Chargement...'}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Globe size={20} />
          </div>
          <div className="stat-copy">
            <p>{t('settings.current_lang', 'Langue active')}</p>
            <strong>{lang === 'fr' ? 'Français (FR)' : 'English (EN)'}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
