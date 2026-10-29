'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, ChevronRight, Bell, ChevronDown, CheckCheck } from 'lucide-react';
import { getNotifications, markNotificationsAsRead, Notification } from '@/lib/api';
import { getUserFullName, getUserInitials } from "@/components/organisms/userUtils";
import { getUserPhotoSrc } from '@/lib/api';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
import { ThemeToggle } from '@/components/molecules/ThemeToggle';

interface LocataireTopbarProps {
  setMobileNav: (open: boolean) => void;
  setShowProfile: (open: boolean) => void;
  activeLabel: string;
  user: any;
}

export function LocataireTopbar({ setMobileNav, setShowProfile, activeLabel, user }: LocataireTopbarProps) {
  const { t, lang } = useTranslation();
  const fullName = getUserFullName(user);
  const initials = getUserInitials(user);
  const photoSrc = getUserPhotoSrc(user);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => { getNotifications().then(setNotifications).catch(console.error) }, []);
  const unreadCount = notifications.filter(n => !n.lu).length;
  const handleToggleNotifications = async () => {
    const wasClosed = !notificationsOpen;
    setNotificationsOpen(wasClosed);
    if (wasClosed && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.lu).map(n => n.id);
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      try { await markNotificationsAsRead(unreadIds); } catch (err) { console.error(err); }
    }
  };

  return (
    <header className="topbar bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <button className="menu-button text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" onClick={() => setMobileNav(true)}>
        <Menu size={21} />
      </button>
      <div className="breadcrumbs text-slate-500 dark:text-slate-400">
        <span>{t("dashboard.topbar.tenant_space", "Espace locataire")}</span>
        <ChevronRight size={15} />
        <strong className="text-slate-800 dark:text-white font-semibold">{activeLabel}</strong>
      </div>
      <div className="top-actions">
        <ThemeToggle />
        <LanguageSwitcher />

        <div className="notification-wrap" style={{ position: 'relative' }}>
          <button
            className="icon-button relative text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-2 transition-colors cursor-pointer"
            aria-label="Notifications"
            onClick={handleToggleNotifications}
          >
            <Bell size={19} />
            {unreadCount > 0 && <i style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />}
          </button>
          
          {notificationsOpen && (
            <div className="notification-popover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden" style={{ position: 'absolute', top: '100%', right: 0, width: 320, zIndex: 50, marginTop: 8, textAlign: 'left' }}>
              <div className="popover-head px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex justify-between items-center">
                <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("dashboard.topbar.notifications", "Alertes")}</strong>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CheckCheck size={14} /> {notifications.length} {t("dashboard.topbar.total_alerts", "au total")}
                </span>
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="py-6 px-4 text-center text-slate-500 dark:text-slate-400 text-xs">{t("dashboard.topbar.no_alerts", "Aucune nouvelle")}</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-3 border-b border-slate-100 dark:border-slate-800 transition-colors ${n.lu ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/40 dark:bg-blue-950/20'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 m-0">{n.titre}</p>
                        {!n.lu && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 m-0 line-clamp-2 leading-relaxed">{n.message}</p>
                      <small className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1.5">{new Date(n.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center">
                <Link
                  href="/locataire/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block py-1"
                >
                  {t("dashboard.topbar.view_all_notifications", "Voir toutes les notifications")} &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
        <button
          className="top-user top-user-button icon-button flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          onClick={() => setShowProfile(true)}
        >
          {photoSrc ? (
            <img src={photoSrc} alt={fullName} className="user-initial" style={{ padding: 0, objectFit: 'cover' }} />
          ) : (
            <div className="user-initial blue">{initials}</div>
          )}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{fullName}</span>
          <ChevronDown size={15} className="text-slate-400 dark:text-slate-500" />
        </button>
      </div>
    </header>
  );
}
