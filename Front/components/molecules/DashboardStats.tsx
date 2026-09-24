import React from 'react';
import { CircleDollarSign, CalendarDays, WalletCards, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Contrat, Paiement } from '@/lib/api';
import { StatCard } from "@/components/molecules/locataire_StatCard";

interface DashboardStatsProps {
  paiements: Paiement[];
  contratActif: Contrat | null;
  loading: boolean;
  error: string | null;
}

export function DashboardStats({ paiements, contratActif, loading, error }: DashboardStatsProps) {
  const formatMontant = (montant: any) => {
    return montant ? `${parseFloat(montant).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : '0 Ar';
  };

  if (loading) {
    return (
      <section className="stats-grid" style={{ opacity: 0.7 }}>
         <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
           <Loader2 size={16} className="animate-spin" /> Calcul des statistiques...
         </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="stats-grid">
         <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
           <AlertCircle size={16} /> Erreur: {error}
         </div>
      </section>
    );
  }

  // 1. Loyer mensuel
  const loyerMensuel = contratActif ? formatMontant(contratActif.loyer) : 'N/A';
  
  // 2. Prochaine échéance
  const paiementsEnAttente = paiements.filter(p => p.statut === 'EN_ATTENTE' || p.statut === 'EN_RETARD');
  let prochaineEcheanceDate = 'Aucune';
  let prochaineEcheanceDetail = 'Aucune échéance future';
  
  if (paiementsEnAttente.length > 0) {
    // Trier pour prendre la date la plus proche
    paiementsEnAttente.sort((a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime());
    const prochaine = paiementsEnAttente[0];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const echeance = new Date(prochaine.date_echeance);
    echeance.setHours(0, 0, 0, 0);
    
    prochaineEcheanceDate = echeance.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    
    const diffTime = echeance.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      prochaineEcheanceDetail = "Aujourd'hui";
    } else if (diffDays === 1) {
      prochaineEcheanceDetail = "Dans 1 jour";
    } else if (diffDays > 1) {
      prochaineEcheanceDetail = `Dans ${diffDays} jours`;
    } else {
      prochaineEcheanceDetail = `En retard de ${Math.abs(diffDays)} jours`;
    }
  }

  // 3. Total versé (Uniquement PAYE/VALIDE, montant du loyer si PAYE)
  const paiementsPayes = paiements.filter(p => p.statut === 'PAYE' || p.statut === 'VALIDE');
  const totalVerse = paiementsPayes.reduce((acc, p) => {
    // Selon la règle, pour un paiement entièrement payé/validé, on utilise le montant du loyer
    const montantEffectif = contratActif ? parseFloat(contratActif.loyer || '0') : parseFloat(p.montant_paye || '0');
    return acc + (isNaN(montantEffectif) ? 0 : montantEffectif);
  }, 0);
  
  // 4. Fin du bail (ou Retards RG-15)
  // L'utilisateur demande d'afficher les retards. Remplaçons la carte "Fin du bail" par "Retards".
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
      <StatCard icon={CircleDollarSign} label="Loyer mensuel" value={loyerMensuel} detail={contratActif ? "Selon contrat actif" : "Aucun contrat"} tone="blue" />
      <StatCard icon={CalendarDays} label="Prochaine échéance" value={prochaineEcheanceDate} detail={prochaineEcheanceDetail} tone="orange" />
      <StatCard icon={WalletCards} label="Total versé" value={formatMontant(totalVerse)} detail={`${paiementsPayes.length} loyers réglés`} tone="green" />
      <StatCard icon={FileText} label="Retards" value={retardsRG15Count.toString()} detail={retardsRG15Count > 0 ? "Paiements en retard" : "Aucun retard constaté"} tone={retardsRG15Count > 0 ? "orange" : "purple"} />
    </section>
  );
}
