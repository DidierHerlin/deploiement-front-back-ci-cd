import React from 'react';
import { ChevronRight, ArrowDownToLine, FileText } from 'lucide-react';
import { Paiement, Contrat } from '@/lib/api';
import { PaiementStatusBadge } from '../../paiements/components/PaiementStatusBadge';

interface DashboardPaiementsRecentsProps {
  paiements: Paiement[];
  contratActif: Contrat | null;
}

export function DashboardPaiementsRecents({ paiements, contratActif }: DashboardPaiementsRecentsProps) {
  // On ne prend que les 5 derniers paiements ayant le statut PAYE ou VALIDE
  const paiementsPayes = paiements.filter(p => p.statut === 'PAYE' || p.statut === 'VALIDE');
  const recents = paiementsPayes.sort((a, b) => new Date(b.date_echeance).getTime() - new Date(a.date_echeance).getTime()).slice(0, 5);

  const formatMontant = (montant: any) => {
    return montant ? `${parseFloat(montant).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : '0 Ar';
  };

  const handleDownloadQuittance = async (paiementId: number) => {
    try {
      const { fetchBlob } = await import('@/lib/api');
      const blob = await fetchBlob(`/paiements/${paiementId}/quittance/`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Quittance_Loyer_${paiementId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors du téléchargement de la quittance", error);
      alert("Impossible de télécharger la quittance.");
    }
  };

  return (
    <section className="panel payments-panel">
      <div className="panel-header">
        <div>
          <h2>Mes derniers paiements</h2>
          <p>Historique de vos loyers et quittances</p>
        </div>
        <button className="outline-button" onClick={() => window.location.href = '/locataire/paiements'}>
          Voir tout <ChevronRight size={15} />
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PÉRIODE</th>
              <th>DATE DE PAIEMENT</th>
              <th>MONTANT</th>
              <th>STATUT</th>
              <th>QUITTANCE</th>
            </tr>
          </thead>
          <tbody>
            {recents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Aucun historique de paiement disponible.
                </td>
              </tr>
            ) : (
              recents.map((payment) => {
                const isValide = payment.statut === 'PAYE' || payment.statut === 'VALIDE';
                const montantEffectif = (isValide && contratActif) ? contratActif.loyer : payment.montant_paye;
                
                const periode = new Date(payment.date_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase());
                const datePaiement = payment.date_paiement ? new Date(payment.date_paiement).toLocaleDateString('fr-FR') : '-';

                return (
                  <tr key={payment.id}>
                    <td><strong>{periode}</strong></td>
                    <td>{datePaiement}</td>
                    <td><strong>{formatMontant(montantEffectif)}</strong></td>
                    <td>
                      <PaiementStatusBadge status={payment.statut} estEnRetard={payment.est_en_retard} />
                    </td>
                    <td>
                      {isValide ? (
                        <button className="download-link" onClick={() => handleDownloadQuittance(payment.id)}>
                          <ArrowDownToLine size={14} /> Télécharger
                        </button>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#a0a8b5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={12} /> Indisponible
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
