import sys

with open(r'Front\components\organisms\LocataireTopbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = "import React, { useState, useEffect } from 'react';\nimport { Menu, ChevronRight, Bell, ChevronDown, CheckCheck } from 'lucide-react';\nimport { getNotifications, markNotificationsAsRead, Notification } from '@/lib/api';\n"
content = content.replace("import React from 'react';\nimport { Menu, ChevronRight, Bell, ChevronDown } from 'lucide-react';", imports)

state = '''  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
'''
content = content.replace("const photoSrc = getUserPhotoSrc(user);", "const photoSrc = getUserPhotoSrc(user);\n" + state)

old_wrap = '''        <div className="notification-wrap">
          <button className="icon-button" aria-label="Notifications">
            <Bell size={19} /><i />
          </button>
        </div>'''

new_wrap = '''        <div className="notification-wrap" style={{ position: 'relative' }}>
          <button className="icon-button" aria-label="Notifications" onClick={handleToggleNotifications}>
            <Bell size={19} />
            {unreadCount > 0 && <i style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />}
          </button>
          
          {notificationsOpen && (
            <div className="notification-popover" style={{ position: 'absolute', top: '100%', right: 0, width: 320, background: 'white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 8, textAlign: 'left' }}>
              <div className="popover-head" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <strong style={{ fontSize: 14, color: 'var(--foreground)' }}>Alertes</strong>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCheck size={14} /> {notifications.length} au total
                </span>
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>Aucune nouvelle</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: n.lu ? 'white' : '#f0f9ff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>{n.titre}</p>
                        {!n.lu && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{n.message}</p>
                      <small style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 6 }}>{new Date(n.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>'''

if old_wrap not in content:
    if old_wrap.replace('\n', '\r\n') in content:
        content = content.replace(old_wrap.replace('\n', '\r\n'), new_wrap)
    else:
        print("COULD NOT FIND OLD WRAP in Locataire")
        sys.exit(1)
else:
    content = content.replace(old_wrap, new_wrap)

with open(r'Front\components\organisms\LocataireTopbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS LOCATAIRE")
