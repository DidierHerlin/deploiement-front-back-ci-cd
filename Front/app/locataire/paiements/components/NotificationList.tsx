'use client'

import React from 'react';
import { Notification, markNotificationsAsRead } from '@/lib/api';
import { CalendarDays, AlertTriangle, FileText, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();

  if (!notifications || notifications.length === 0) {
    return null; // On ne montre pas la section si pas de notifications
  }

  // Fonction pour déterminer l'icône et la couleur selon le type
  const getIconData = (type: string) => {
    switch(type) {
      case 'ECHEANCE_PROCHE':
        return { icon: CalendarDays, tone: 'blue' };
      case 'PAIEMENT_EN_RETARD':
        return { icon: AlertTriangle, tone: 'red' };
      case 'CONTRAT_CREE':
        return { icon: FileText, tone: 'orange' };
      case 'PAIEMENT_VALIDE':
        return { icon: CheckCircle2, tone: 'green' };
      default:
        return { icon: Info, tone: 'blue' };
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.lu) {
      try {
        await markNotificationsAsRead([notif.id]);
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.lien) {
      // Si c'est un lien d'API (comme le téléchargement de quittance), on gère autrement
      if (notif.lien.startsWith('/api/')) {
         window.open(`http://localhost:8000${notif.lien}`, '_blank');
      } 
      // Mapping du lien backend vers le routeur frontend du locataire
      else if (notif.lien.startsWith('/contrats/')) {
         router.push('/locataire/contrat');
      } else if (notif.lien.startsWith('/paiements/')) {
         router.push('/locataire/paiements');
      } else {
         router.push(notif.lien);
      }
    }
  };

  return (
    <section className="panel notifications-section" style={{ marginTop: '20px' }}>
      <div className="panel-header">
        <div>
          <h2>Mes notifications</h2>
          <p>Les informations importantes concernant votre dossier</p>
        </div>
      </div>
      <div className="notification-row">
        {notifications.map((item) => { 
          const { icon: Icon, tone } = getIconData(item.type); 
          return (
            <div 
              className="notification-card" 
              key={item.id} 
              style={{ opacity: item.lu ? 0.7 : 1, cursor: item.lien ? 'pointer' : 'default' }}
              onClick={() => handleNotificationClick(item)}
            >
              <div className={`notification-icon ${tone}`}><Icon size={16} /></div>
              <div>
                <strong>{item.titre || item.type_display || item.type}</strong>
                <p>{item.message}</p>
                <small>{new Date(item.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  );
}

