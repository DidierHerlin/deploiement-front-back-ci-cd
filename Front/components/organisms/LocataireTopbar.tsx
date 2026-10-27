'use client'

import React, { useState, useEffect } from 'react';
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
    <header className="topbar">
      <button className="menu-button" onClick={() => setMobileNav(true)}>
        <Menu size={21} />
      </button>
      <div className="breadcrumbs">
        <span>{t("dashboard.topbar.tenant_space", "Espace locataire")}</span><ChevronRight size={15} /><strong>{activeLabel}</strong>
      </div>
      <div className="top-actions">
        <ThemeToggle />
        <LanguageSwitcher />

        <div className="notification-wrap" style={{ position: 'relative' }}>
          <button className="icon-button" aria-label="Notifications" onClick={handleToggleNotifications}>
            <Bell size={19} />
            {unreadCount > 0 && <i style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />}
          </button>
          
          {notificationsOpen && (
            <div className="notification-popover" style={{ position: 'absolute', top: '100%', right: 0, width: 320, background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 8, textAlign: 'left' }}>
              <div className="popover-head" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <strong style={{ fontSize: 14, color: 'var(--foreground)' }}>{t("dashboard.topbar.notifications", "Alertes")}</strong>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCheck size={14} /> {notifications.length} {t("dashboard.topbar.total_alerts", "au total")}
                </span>
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>{t("dashboard.topbar.no_alerts", "Aucune nouvelle")}</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: n.lu ? 'white' : '#f0f9ff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>{n.titre}</p>
                        {!n.lu && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{n.message}</p>
                      <small style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 6 }}>{new Date(n.date_creation).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button className="top-user top-user-button icon-button" onClick={() => setShowProfile(true)}>
          {photoSrc ? (
            <img src={photoSrc} alt={fullName} className="user-initial" style={{ padding: 0, objectFit: 'cover' }} />
          ) : (
            <div className="user-initial blue">{initials}</div>
          )}
          <span className="text-slate-700 dark:text-slate-200">{fullName}</span>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}
