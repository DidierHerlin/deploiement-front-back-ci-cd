'use client'

import React from 'react';
import { Paiement } from '@/lib/api';
import { StatCard } from "@/components/molecules/locataire_StatCard";
import { CircleDollarSign, CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PaiementStatsProps {
  paiements: Paiement[];
}

export function PaiementStats({ paiements }: PaiementStatsProps) {
  // Calculs depuis les données API
  const paiementsEnAttente = paiements.filter(p => p.statut === 'EN_ATTENTE' || p.statut === 'PARTIEL');
  const paiementsEnRetard = paiements.filter(p => {
    // Ne pas compter un paiement déjà payé ou annulé comme un retard actif nécessitant action
    if (p.statut === 'PAYE' || p.statut === 'VALIDE' || p.statut === 'ANNULE') return false;
    
    const echeance = new Date(p.date_echeance);
    const today = new Date();
    echeance.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - echeance.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // RG-15 : Strictement supérieur à 5 jours
    return diffDays > 5;
  });
  
  // Prochaine échéance
  const prochaines = [...paiementsEnAttente].sort((a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime());
  const prochainPaiement = prochaines.length > 0 ? prochaines[0] : null;

  const nbEnAttente = paiementsEnAttente.length;
  const nbEnRetard = paiementsEnRetard.length;

  // Calcul du montant total versé
  // Règle: Uniquement paiements PAYE/VALIDE, et on utilise le montant du loyer du contrat
  const totalPaye = paiements
    .filter(p => p.statut === 'PAYE' || p.statut === 'VALIDE')
    .reduce((acc, curr) => {
      const montantEffectif = parseFloat((curr.loyer_contrat as string) || (curr.montant_attendu as string) || '0') || 0;
      return acc + montantEffectif;
    }, 0);

  let detailEcheance = "Aucune prochaine échéance";
  if (prochainPaiement) {
    const echeanceDate = new Date(prochainPaiement.date_echeance);
    const today = new Date();
    echeanceDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = echeanceDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      detailEcheance = `Dans ${diffDays} jours`;
    } else if (diffDays === 1) {
      detailEcheance = "Dans 1 jour";
    } else if (diffDays === 0) {
      detailEcheance = "Aujourd'hui";
    } else {
      detailEcheance = `En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    }
  }

  return (
    <section className="stats-grid">
      <StatCard 
        icon={CircleDollarSign} 
        label="Prochain loyer" 
        value={prochainPaiement ? `${parseFloat((prochainPaiement.loyer_contrat as string) || (prochainPaiement.montant_attendu as string) || '0').toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : '-'} 
        detail={prochainPaiement ? `Contrat: ${prochainPaiement.bien_titre}` : "Aucun loyer en attente"} 
        tone="blue" 
      />
      <StatCard 
        icon={CalendarDays} 
        label="Échéance" 
        value={prochainPaiement ? new Date(prochainPaiement.date_echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'} 
        detail={detailEcheance} 
        tone="orange" 
      />
      <StatCard 
        icon={AlertTriangle} 
        label="Retards" 
        value={`${nbEnRetard}`} 
        detail={nbEnRetard > 0 ? "Paiements en retard" : "Aucun retard constaté"} 
        tone={nbEnRetard > 0 ? "red" : "green"} 
      />
      <StatCard 
        icon={CheckCircle2} 
        label="Total versé" 
        value={`${totalPaye.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar`} 
        detail="Historique complet" 
        tone="purple" 
      />
    </section>
  );
}
