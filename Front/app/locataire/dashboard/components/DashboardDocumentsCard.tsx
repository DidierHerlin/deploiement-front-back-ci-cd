import React from 'react';
import { LockKeyhole, FileCheck2, FileText, ReceiptText, ArrowDownToLine, CheckCircle2 } from 'lucide-react';
import { Contrat, Paiement } from '@/lib/api';

interface DashboardDocumentsCardProps {
  contrat: Contrat | null;
  paiements: Paiement[];
}

export function DashboardDocumentsCard({ contrat, paiements }: DashboardDocumentsCardProps) {
  
  // Chercher la dernière quittance disponible
  const paiementsPayes = paiements.filter(p => p.statut === 'PAYE' || p.statut === 'VALIDE');
  paiementsPayes.sort((a, b) => new Date(b.date_echeance).getTime() - new Date(a.date_echeance).getTime());
  const derniereQuittance = paiementsPayes.length > 0 ? paiementsPayes[0] : null;

  const handleDownloadContrat = async () => {
    if (!contrat) return;
    try {
      const { fetchBlob } = await import('@/lib/api');
      const blob = await fetchBlob(`/contrats/${contrat.id}/telecharger/`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Contrat_Bail_${contrat.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      const isIDM = e.message && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError') || e.name === 'TypeError');
      if (!isIDM) { 
        alert("Erreur de téléchargement"); 
      } else { 
        console.log("Téléchargement intercepté"); 
      }
    }
  };

  const handleDownloadQuittance = async () => {
    if (!derniereQuittance) return;
    try {
      const { fetchBlob } = await import('@/lib/api');
      const blob = await fetchBlob(`/paiements/${derniereQuittance.id}/quittance/`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Quittance_Loyer_${derniereQuittance.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      const isIDM = e.message && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError') || e.name === 'TypeError');
      if (!isIDM) { 
        alert("Erreur de téléchargement"); 
      } else { 
        console.log("Téléchargement intercepté"); 
      }
    }
  };

  return (
    <section className="panel documents-panel">
      <div className="panel-header">
        <div>
          <h2>Mes documents</h2>
          <p>Pièces stockées de manière sécurisée</p>
        </div>
        <LockKeyhole size={19} className="security-check" />
      </div>
      <div className="document-list">
        <div>
          <FileCheck2 size={17} />
          <span>Pièce d'identité<small>Vérifiée • Document sécurisé</small></span>
          <CheckCircle2 size={15} style={{ color: 'var(--primary)' }} />
        </div>
        
        {contrat && (
          <div style={{ cursor: 'pointer' }} onClick={handleDownloadContrat}>
            <FileText size={17} />
            <span>Contrat de location<small>Signé le {new Date(contrat.date_creation || contrat.date_debut || '').toLocaleDateString('fr-FR')}</small></span>
            <ArrowDownToLine size={15} />
          </div>
        )}
        
        {derniereQuittance && (
          <div style={{ cursor: 'pointer' }} onClick={handleDownloadQuittance}>
            <ReceiptText size={17} />
            <span>Dernière quittance<small>{new Date(derniereQuittance.date_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</small></span>
            <ArrowDownToLine size={15} />
          </div>
        )}
      </div>
    </section>
  );
}
