'use client'

import React from 'react';
import { CircleDollarSign, CalendarDays, WalletCards, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Contrat, Paiement } from '@/lib/api';
import { StatCard } from "@/components/molecules/locataire_StatCard";
import { useTranslation } from '@/lib/i18n';

interface DashboardStatsProps {
  paiements: Paiement[];
  contratActif: Contrat | null;
  loading: boolean;
  error: string | null;
}

export function DashboardStats({ paiements, contratActif, loading, error }: DashboardStatsProps) {
  const { t, lang } = useTranslation();

  const formatMontant = (montant: any) => {
    return montant ? `${parseFloat(montant).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : '0 Ar';
  };

  if (loading) {
    return (
      <section className="stats-grid" style={{ opacity: 0.7 }}>
         <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
           <Loader2 size={16} className="animate-spin" /> {t('dashboard.locataire.stats_loading', 'Calcul des statistiques...')}
         </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="stats-grid">
         <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
           <AlertCircle size={16} /> {t('common.error_occurred', 'Erreur')}: {error}
         </div>
      </section>
    );
  }

  // 1. Loyer mensuel
  const loyerMensuel = contratActif ? formatMontant(contratActif.loyer) : '—';
  
  // 2. Prochaine échéance
  const paiementsEnAttente = paiements.filter(p => p.statut === 'EN_ATTENTE' || p.statut === 'EN_RETARD');
  let prochaineEcheanceDate = '—';
  let prochaineEcheanceDetail = lang === 'en' ? 'Nothing due right now' : 'Rien à régler pour le moment';
  
  if (paiementsEnAttente.length > 0) {
    paiementsEnAttente.sort((a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime());
    const prochaine = paiementsEnAttente[0];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const echeance = new Date(prochaine.date_echeance);
    echeance.setHours(0, 0, 0, 0);
    
    prochaineEcheanceDate = echeance.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'short' });
    
    const diffTime = echeance.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      prochaineEcheanceDetail = lang === 'en' ? 'Today' : "Aujourd'hui";
    } else if (diffDays === 1) {
      prochaineEcheanceDetail = lang === 'en' ? 'In 1 day' : "Dans 1 jour";
    } else if (diffDays > 1) {
      prochaineEcheanceDetail = lang === 'en' ? `In ${diffDays} days` : `Dans ${diffDays} jours`;
    } else {
      prochaineEcheanceDetail = lang === 'en' ? `Overdue by ${Math.abs(diffDays)} days` : `En retard de ${Math.abs(diffDays)} jours`;
    }
  }

  // 3. Total versé
  const paiementsPayes = paiements.filter(p => p.statut === 'PAYE' || p.statut === 'VALIDE');
  const totalLoyersVerses = paiementsPayes.reduce((acc, p) => {
    const montantEffectif = contratActif ? parseFloat(contratActif.loyer || '0') : parseFloat(p.montant_paye || '0');
    return acc + (isNaN(montantEffectif) ? 0 : montantEffectif);
  }, 0);
  
  const depotGarantie = contratActif && contratActif.depot_garantie ? parseFloat(contratActif.depot_garantie) : 0;
  const totalVerse = totalLoyersVerses + (isNaN(depotGarantie) ? 0 : depotGarantie);
  
  let detailVerse = '';
  if (paiementsPayes.length === 0) {
    detailVerse = lang === 'en' ? 'No rent paid' : 'Aucun loyer réglé';
  } else if (paiementsPayes.length === 1) {
    detailVerse = lang === 'en' ? '1 rent paid' : '1 loyer réglé';
  } else {
    detailVerse = lang === 'en' ? `${paiementsPayes.length} rents paid` : `${paiementsPayes.length} loyers réglés`;
  }
  if (depotGarantie > 0) {
    detailVerse += ` (+ ${lang === 'en' ? 'Deposit' : 'Dépôt'} ${formatMontant(depotGarantie)})`;
  }

  // 4. Statut des paiements (Retards)
  let retardsRG15Count = 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  
  paiementsEnAttente.forEach(p => {
    const echeance = new Date(p.date_echeance);
    echeance.setHours(0,0,0,0);
    const diffTime = today.getTime() - echeance.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 5) {
      retardsRG15Count++;
    }
  });

  return (
    <section className="stats-grid">
      <StatCard 
        icon={CircleDollarSign} 
        label={t('dashboard.locataire.monthly_rent', 'Loyer mensuel')} 
        value={loyerMensuel} 
        detail={contratActif ? (lang === 'en' ? 'From active lease' : 'Selon contrat actif') : (lang === 'en' ? 'No active lease' : 'Aucun bail actif')} 
        tone="blue" 
      />
      <StatCard 
        icon={CalendarDays} 
        label={t('dashboard.locataire.next_due', 'Prochaine échéance')} 
        value={prochaineEcheanceDate} 
        detail={prochaineEcheanceDetail} 
        tone="orange" 
      />
      <StatCard 
        icon={WalletCards} 
        label={t('dashboard.locataire.total_paid', 'Total versé')} 
        value={formatMontant(totalVerse)} 
        detail={detailVerse} 
        tone="green" 
      />
      <StatCard 
        icon={retardsRG15Count > 0 ? AlertCircle : CheckCircle2} 
        label={t('dashboard.locataire.payment_status', 'Statut des paiements')} 
        value={retardsRG15Count === 0 ? (lang === 'en' ? 'Up to date' : 'À jour') : retardsRG15Count.toString()} 
        detail={retardsRG15Count > 0 ? t('dashboard.locataire.overdue_detected', 'Paiements en retard') : t('dashboard.locataire.no_overdue', 'Aucun retard constaté')} 
        tone={retardsRG15Count > 0 ? "orange" : "green"} 
      />
    </section>
  );
}
