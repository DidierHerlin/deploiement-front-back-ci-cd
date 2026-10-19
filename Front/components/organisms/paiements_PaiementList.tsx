'use client'

import React, { useState } from 'react';
import { Paiement } from '@/lib/api';
import { usePathname } from 'next/navigation';

import { FactureModal } from '@/components/organisms/FactureModal';
import { ValidationDemandeModal } from '@/components/organisms/ValidationDemandeModal';
import { ArrowDownToLine, FileText, Eye, Smartphone, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { PaiementStatusBadge } from "@/components/atoms/paiement_PaiementStatusBadge";
import { Pagination } from "@/components/molecules/pagination";

interface PaiementListProps {
  paiements: Paiement[];
  onUpdate?: (p: Paiement) => void;
  onDemanderPaiement?: (p: Paiement) => void;
}

export function PaiementList({ paiements: initialPaiements, onUpdate, onDemanderPaiement }: PaiementListProps) {
  const pathname = usePathname();
  const isAgent = pathname?.includes('/agent') || pathname?.includes('/admin');
  const isLocataire = pathname?.includes('/locataire') || !isAgent;
  const [paiements, setPaiements] = useState<Paiement[]>(initialPaiements);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [validationPaiement, setValidationPaiement] = useState<Paiement | null>(null);
  const [validationAction, setValidationAction] = useState<'valider' | 'refuser'>('valider');
  React.useEffect(() => setPaiements(initialPaiements), [initialPaiements]);
  
  const handleUpdate = (updated: Paiement) => {
    setPaiements(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (onUpdate) onUpdate(updated);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

    
  const totalPages = Math.ceil(paiements.length / ITEMS_PER_PAGE);
  const paginatedData = paiements.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
    } catch (error: any) {
      const isIDM = error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError');
      if (!isIDM) {
        console.error("Erreur lors du téléchargement de la quittance", error);
        alert("Impossible de télécharger la quittance.");
      } else {
        console.log("Téléchargement intercepté par un gestionnaire externe (ex: IDM).");
      }
    }
  };

  return (
    <>
      <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Historique des paiements</h2>
          <p>Suivez l'état de vos loyers et téléchargez vos quittances </p>
        </div>
      </div>
      
      {paiements.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#7b8494' }}>
          Aucun paiement trouvé pour vos contrats avec ce filtre.
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
                  {(isAgent || isLocataire) && <th>ACTION</th>}
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
                          statut={paiement.statut} 
                        />
                        {paiement.statut === 'EN_ATTENTE' && (['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY'].includes(paiement.mode_paiement || '') || !!paiement.demande_en_cours) && (
                          <div style={{ marginTop: '4px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              <Smartphone size={10} /> {paiement.demande_en_cours?.moyen_paiement || paiement.mode_paiement || 'Mobile Money'}
                            </span>
                            {(paiement.demande_en_cours?.reference || paiement.reference) && (
                              <div style={{ fontSize: '10px', color: '#047857', marginTop: '2px', fontFamily: 'monospace' }}>
                                Réf: {paiement.demande_en_cours?.reference || paiement.reference}
                              </div>
                            )}
                          </div>
                        )}
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
                      {(isAgent || isLocataire) && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => setSelectedPaiement(paiement)} 
                              className="outline-button" 
                              style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                              title="Consulter les détails de la facture"
                            >
                              <Eye size={14} /> Visualiser
                            </button>

                            {isAgent && paiement.statut === 'EN_ATTENTE' && (['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY'].includes(paiement.mode_paiement || '') || !!paiement.demande_en_cours) && (
                              <>
                                <button
                                  onClick={() => {
                                    setValidationPaiement(paiement);
                                    setValidationAction('valider');
                                  }}
                                  className="primary-button"
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    backgroundColor: "#059669",
                                    color: "#ffffff",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                  title="Valider la réception de ce paiement Mobile Money"
                                >
                                  <CheckCircle2 size={14} /> Valider la demande
                                </button>
                                <button
                                  onClick={() => {
                                    setValidationPaiement(paiement);
                                    setValidationAction('refuser');
                                  }}
                                  className="outline-button"
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: "12px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    color: "#dc2626",
                                    borderColor: "#fca5a5",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                  }}
                                  title="Refuser cette demande Mobile Money"
                                >
                                  <XCircle size={14} /> Refuser
                                </button>
                              </>
                            )}

                            {isLocataire && paiement.est_eligible_demande && onDemanderPaiement && (
                              <button
                                onClick={() => onDemanderPaiement(paiement)}
                                className="primary-button"
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  backgroundColor: "#4f46e5",
                                  color: "#ffffff",
                                  borderRadius: "6px",
                                  boxShadow: "none",
                                }}
                                title="Demander le règlement de cette facture par Mobile Money"
                              >
                                <Smartphone size={14} /> Payer (Mobile Money)
                              </button>
                            )}

                            {isLocataire && paiement.demande_en_cours && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#fef3c7",
                                  color: "#b45309",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                }}
                                title="Une demande de paiement Mobile Money est déjà enregistrée pour cette facture"
                              >
                                <Clock size={12} /> Demande en cours
                              </span>
                            )}

                            {isLocataire && paiement.statut === 'EN_ATTENTE' && !paiement.demande_en_cours && paiement.a_echeance_anterieure_impayee && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#f1f5f9",
                                  color: "#64748b",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                }}
                                title="Vous devez d'abord régler la facture précédente la plus ancienne pour débloquer celle-ci"
                              >
                                <Clock size={12} /> Échéance précédente requise
                              </span>
                            )}
                          </div>
                        </td>
                      )}
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
      {selectedPaiement && <FactureModal paiement={selectedPaiement} isAgent={isAgent} onClose={() => setSelectedPaiement(null)} onStatusChange={handleUpdate} />}
      {validationPaiement && (
        <ValidationDemandeModal
          paiement={validationPaiement}
          isOpen={!!validationPaiement}
          initialAction={validationAction}
          onClose={() => setValidationPaiement(null)}
          onSuccess={() => {
            setValidationPaiement(null);
            if (onUpdate) onUpdate(validationPaiement);
          }}
        />
      )}
    </>
  );
}







