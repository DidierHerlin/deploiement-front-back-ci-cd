'use client'

import React, { useState } from 'react';
import { Paiement } from '@/lib/api';
import { ArrowDownToLine, FileText } from 'lucide-react';
import { PaiementStatusBadge } from './PaiementStatusBadge';
import { Pagination } from '@/components/ui/pagination';

interface PaiementListProps {
  paiements: Paiement[];
}

export function PaiementList({ paiements }: PaiementListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Règle: Ne lister que les paiements validés/payés
  const paiementsPayes = paiements.filter(p => p.statut === 'PAYE' || p.statut === 'VALIDE');

  const totalPages = Math.ceil(paiementsPayes.length / ITEMS_PER_PAGE);
  const paginatedData = paiementsPayes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Historique des paiements</h2>
          <p>Suivez l'état de vos loyers et téléchargez vos quittances </p>
        </div>
      </div>
      
      {paiementsPayes.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#7b8494' }}>
          Aucun paiement validé trouvé pour vos contrats.
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>DATE D'ÉCHÉANCE</th>
                  <th>BIEN CONCERNÉ</th>
                  <th>MONTANT ATTENDU</th>
                  <th>MONTANT VERSÉ</th>
                  <th>STATUT</th>
                  <th>QUITTANCE</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((paiement) => {
                  const isValide = paiement.statut === 'PAYE' || paiement.statut === 'VALIDE';
                  
                  // Règle : Si PAYE/VALIDE -> ATTENDU = VERSÉ = Loyer du contrat
                  // (Même si le backend renvoie 0, on affiche le loyer réel pour un paiement validé complet)
                  const loyerContrat = paiement.loyer_contrat || paiement.montant_attendu;
                  
                  const montantVerse = isValide ? loyerContrat : (paiement.montant_paye || paiement.montant);
                  const montantAttendu = isValide ? loyerContrat : paiement.montant_attendu;

                  return (
                    <tr key={paiement.id}>
                      <td>
                        <strong>
                          {paiement.date_echeance ? new Date(paiement.date_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '-'}
                        </strong>
                        <br/>
                        <small style={{ color: '#9aa3b0' }}>
                          Prévu le {paiement.date_echeance ? new Date(paiement.date_echeance).toLocaleDateString('fr-FR') : '-'}
                        </small>
                      </td>
                      <td>{paiement.bien_titre || '-'}</td>
                      <td>{montantAttendu ? `${parseFloat(montantAttendu as string).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : '-'}</td>
                      <td>
                        {montantVerse ? (
                          <strong>{parseFloat(montantVerse as string).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar</strong>
                        ) : '-'}
                      </td>
                      <td>
                        <PaiementStatusBadge 
                          status={paiement.statut} 
                          estPartiel={paiement.est_partiel} 
                          estEnRetard={paiement.est_en_retard} 
                        />
                      </td>
                      <td>
                        {isValide ? (
                          <button className="download-button outline-button" onClick={() => handleDownloadQuittance(paiement.id)}>
                            <ArrowDownToLine size={14} /> Voir la quittance
                          </button>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#a0a8b5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={12} /> Quittance non disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ marginTop: '1rem' }}>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
