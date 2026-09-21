import React from 'react';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { Paiement, Contrat } from '@/lib/api';

interface DashboardProchaineEcheanceCardProps {
  paiements: Paiement[];
  contratActif: Contrat | null;
}

export function DashboardProchaineEcheanceCard({ paiements, contratActif }: DashboardProchaineEcheanceCardProps) {
  const paiementsEnAttente = paiements.filter(p => p.statut === 'EN_ATTENTE' || p.statut === 'EN_RETARD');
  
  if (paiementsEnAttente.length === 0) {
    return (
      <aside className="panel due-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CheckCircle2 size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>À jour !</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Vous n'avez aucune échéance en attente.</p>
      </aside>
    );
  }

  // Prendre la plus proche
  paiementsEnAttente.sort((a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime());
  const prochaine = paiementsEnAttente[0];

  const echeance = new Date(prochaine.date_echeance);
  const monthYear = echeance.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
  const day = echeance.toLocaleDateString('fr-FR', { day: '2-digit' });
  
  const formatMontant = (montant: any) => {
    return montant ? `${parseFloat(montant).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : '0 Ar';
  };

  const montantEffectif = contratActif ? contratActif.loyer : prochaine.montant_attendu;

  return (
    <aside className="panel due-panel">
      <div className="panel-header">
        <div>
          <h2>Prochaine échéance</h2>
          <p>{echeance.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
        </div>
        <CalendarDays size={21} className="calendar-check" />
      </div>
      <div className="due-date">
        <strong>{day}</strong>
        <div>
          <span>{monthYear}</span>
          <p>Loyer et charges</p>
        </div>
      </div>
      <div className="due-amount">
        <span>Montant à régler</span>
        <strong>{formatMontant(montantEffectif)}</strong>
      </div>
      {paiementsEnAttente.length > 1 && (
        <div className="due-notice" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
          <span style={{ fontSize: '13px' }}>Attention : Votre prochain paiement ce sera {echeance.toLocaleDateString('fr-FR')}</span>
        </div>
      )}
    </aside>
  );
}
