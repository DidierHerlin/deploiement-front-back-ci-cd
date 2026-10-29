'use client'

import React, { useState, useMemo } from 'react';
import { Paiement, Contrat } from '@/lib/api';
import { usePathname } from 'next/navigation';

import { FactureModal } from '@/components/organisms/FactureModal';
import { ValidationDemandeModal } from '@/components/organisms/ValidationDemandeModal';
import { ArrowDownToLine, FileText, Eye, Smartphone, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { PaiementStatusBadge } from "@/components/atoms/paiement_PaiementStatusBadge";
import { Pagination } from "@/components/molecules/pagination";
import { useTranslation } from '@/lib/i18n';

interface PaiementListProps {
  paiements: Paiement[];
  contrats?: Contrat[];
  onUpdate?: (p: Paiement) => void;
  onDemanderPaiement?: (p: Paiement) => void;
}

export function PaiementList({ paiements: initialPaiements, contrats = [], onUpdate, onDemanderPaiement }: PaiementListProps) {
  const { t } = useTranslation();
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

  // Filtrer les paiements associés à un contrat résilié
  const isContratResilie = (p: Paiement): boolean => {
    // 1. Champ contrat_statut explicite sur le paiement
    const directStatut = (p as any).contrat_statut;
    if (typeof directStatut === 'string') {
      const s = directStatut.trim().toUpperCase();
      if (s === 'RESILIE' || s === 'RÉSILIÉ') return true;
    }

    // 2. Objet contrat imbriqué sur le paiement
    if (typeof p.contrat === 'object' && p.contrat !== null) {
      const s = (p.contrat as any).statut;
      if (typeof s === 'string') {
        const sUpper = s.trim().toUpperCase();
        if (sUpper === 'RESILIE' || sUpper === 'RÉSILIÉ') return true;
      }
    }

    // 3. Statut issu de la liste des contrats
    const contratId = typeof p.contrat === 'object' && p.contrat !== null ? (p.contrat as any).id : p.contrat;
    if (contratId && contrats && contrats.length > 0) {
      const c = contrats.find(contrat => contrat.id === contratId);
      if (c?.statut) {
        const sUpper = c.statut.trim().toUpperCase();
        if (sUpper === 'RESILIE' || sUpper === 'RÉSILIÉ') return true;
      }
    }

    return false;
  };

  const paiementsVisibles = useMemo(() => {
    return paiements.filter(p => !isContratResilie(p));
  }, [paiements, contrats]);

  const totalPages = Math.ceil(paiementsVisibles.length / ITEMS_PER_PAGE);
  const paginatedData = paiementsVisibles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
        alert(t("locataire_pages.quittances.download_error", "Impossible de télécharger la quittance."));
      } else {
        console.log("Téléchargement intercepté par un gestionnaire externe (ex: IDM).");
      }
    }
  };

  return (
    <>
      <section className="panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
      <div className="panel-header">
        <div>
          <h2 className="text-slate-900 dark:text-white font-bold text-base m-0">{t("proprietaire_pages.paiements.list_title", "Historique des paiements")}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{t("proprietaire_pages.paiements.list_sub", "Suivez l'état de vos loyers et téléchargez vos quittances ")}</p>
        </div>
      </div>
      
      {paiementsVisibles.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#7b8494' }}>
          {t("proprietaire_pages.paiements.empty_filtered", "Aucun paiement trouvé pour vos contrats avec ce filtre.")}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t("admin.paiements.col_due_date", "ÉCHÉANCE")}</th>
                  <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t("admin.paiements.col_property", "BIEN")}</th>
                  <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t("admin.paiements.col_amount", "MONTANT")}</th>
                  <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t("admin.paiements.col_paid_amount", "VERSÉ")}</th>
                  <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t("admin.paiements.col_status", "STATUT")}</th>
                  <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t("dashboard.nav.receipts", "QUITTANCES")}</th>
                  {(isAgent || isLocataire) && <th className="text-xs uppercase text-slate-400 font-semibold py-3 px-3 text-left">{t("admin.paiements.col_actions", "ACTIONS")}</th>}
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
                    <tr key={paiement.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 dark:text-white font-medium text-xs sm:text-sm">
                          {paiement.date_echeance ? new Date(paiement.date_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '-'}
                        </strong>
                        <br/>
                        <small className="text-slate-400 dark:text-slate-500 text-[11px]">
                          {t("dashboard.common.due_on", "Prévu le")} {paiement.date_echeance ? new Date(paiement.date_echeance).toLocaleDateString('fr-FR') : '-'}
                        </small>
                      </td>
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{paiement.bien_titre || '-'}</td>
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium">{montantAttendu ? `${parseFloat(montantAttendu as string).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : '-'}</td>
                      <td className="py-3 px-3 text-xs sm:text-sm">
                        {montantVerse ? (
                          <strong className="text-slate-900 dark:text-white font-semibold">{parseFloat(montantVerse as string).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar</strong>
                        ) : <span className="text-slate-400 dark:text-slate-500">-</span>}
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3">
                        {isValide ? (
                          <button className="download-button outline-button dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 text-xs inline-flex items-center gap-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors" onClick={() => handleDownloadQuittance(paiement.id)}>
                            <ArrowDownToLine size={14} /> {t("locataire_pages.quittances.download_btn", "Voir la quittance")}
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] inline-flex items-center gap-1.5 whitespace-nowrap">
                            <FileText size={12} /> {t("locataire_pages.quittances.unavailable", "Quittance non disponible")}
                          </span>
                        )}
                      </td>
                      {(isAgent || isLocataire) && (
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedPaiement(paiement)} 
                              className="outline-button dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-xs inline-flex items-center gap-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
                              title={t("forms.view_invoice", "Consulter les détails de la facture")}
                            >
                              <Eye size={14} /> {t("forms.view", "Visualiser")}
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
                                  title={t("admin.paiements.validate_hint", "Valider la réception de ce paiement Mobile Money")}
                                >
                                  <CheckCircle2 size={14} /> {t("admin.paiements.mobile_money_confirm_btn", "Valider la demande")}
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
                                  title={t("admin.paiements.reject_hint", "Refuser cette demande Mobile Money")}
                                >
                                  <XCircle size={14} /> {t("admin.paiements.mobile_money_reject_btn", "Refuser")}
                                </button>
                              </>
                            )}

                            {isLocataire && paiement.est_eligible_demande && onDemanderPaiement && (
                              <button
                                onClick={() => onDemanderPaiement(paiement)}
                                className="primary-button bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs inline-flex items-center gap-1.5 rounded-lg whitespace-nowrap font-semibold cursor-pointer shadow-none transition-colors"
                                title={t("locataire_pages.paiements.pay_hint", "Demander le règlement de cette facture par Mobile Money")}
                              >
                                <Smartphone size={14} /> {t("locataire_pages.paiements.pay_button", "Payer mon loyer en ligne")}
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
                                title={t("locataire_pages.paiements.pending_hint", "Une demande de paiement Mobile Money est déjà enregistrée pour cette facture")}
                              >
                                <Clock size={12} /> {t("locataire_pages.paiements.request_pending", "Demande en cours")}
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
                                title={t("locataire_pages.paiements.prior_due_hint", "Vous devez d'abord régler la facture précédente la plus ancienne pour débloquer celle-ci")}
                              >
                                <Clock size={12} /> {t("locataire_pages.paiements.prior_due_required", "Échéance précédente requise")}
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
