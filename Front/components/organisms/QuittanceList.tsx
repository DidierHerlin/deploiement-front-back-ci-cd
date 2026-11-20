'use client'

import React from 'react';
import { FileText, Download, Loader2, Search } from 'lucide-react';
import { Paiement, Contrat } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { formatMontantAr } from '@/lib/utils';

interface QuittanceListProps {
  paiements: Paiement[];
  contrats: Contrat[];
  loading: boolean;
  currentUser?: any;
}

export function QuittanceList({ paiements, contrats, loading, currentUser }: QuittanceListProps) {
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleDownloadQuittance = async (paiementId: number, isAchatDoc: boolean = false) => {
    try {
      const { fetchBlob } = await import('@/lib/api');
      const blob = await fetchBlob(`/paiements/${paiementId}/quittance/`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = isAchatDoc ? `recu_achat_${paiementId}.pdf` : `Quittance_Loyer_${paiementId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      const isIDM = error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError');
      if (!isIDM) {
        console.error("Erreur lors du téléchargement", error);
        alert(t('common.error_occurred', "Impossible de télécharger la quittance."));
      } else {
        console.log("Téléchargement intercepté par un gestionnaire externe (ex: IDM).");
      }
    }
  };

  const getContratTitre = (contratId: number | any) => {
    const id = typeof contratId === 'object' && contratId !== null ? contratId.id : contratId;
    const c = contrats.find(c => c.id === id);
    return c ? c.bien_titre : 'Contrat inconnu';
  };

  // Filtrer uniquement les paiements validés qui ont une quittance théoriquement disponible
  let quittancesDisponibles = paiements.filter(p => p.statut === 'PAYE' || p.statut === 'VALIDE');

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    quittancesDisponibles = quittancesDisponibles.filter(p => {
      const periode = new Date(p.date_echeance).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' });
      const contratId = typeof p.contrat === 'object' && p.contrat !== null ? (p.contrat as any).id : p.contrat;
      const c = contrats.find(c => c.id === contratId);
      const bienTitre = c?.bien_titre || p.bien_titre || '';
      return (
        periode.toLowerCase().includes(term) ||
        bienTitre.toLowerCase().includes(term) ||
        p.id.toString().includes(term)
      );
    });
  }

  // Trier par date la plus récente
  quittancesDisponibles.sort((a, b) => new Date(b.date_echeance).getTime() - new Date(a.date_echeance).getTime());

  // Détection des types de documents présents dans la liste
  const aDesAchats = quittancesDisponibles.some(p => {
    const contratId = typeof p.contrat === 'object' && p.contrat !== null ? (p.contrat as any).id : p.contrat;
    const c = contrats.find(c => c.id === contratId);
    return c?.type_contrat === 'ACHAT' || (p as any).type_contrat === 'ACHAT' || (!c?.loyer && !(p as any).loyer_contrat && !!(c?.prix || (p as any).prix_contrat));
  });

  const aDesLocations = quittancesDisponibles.some(p => {
    const contratId = typeof p.contrat === 'object' && p.contrat !== null ? (p.contrat as any).id : p.contrat;
    const c = contrats.find(c => c.id === contratId);
    return c ? c.type_contrat === 'LOCATION' : (p as any).type_contrat !== 'ACHAT';
  });

  const pageTitle = (aDesAchats && aDesLocations) || aDesAchats
    ? t('locataire_pages.quittances.title_mixed', 'Mes quittances et reçus')
    : t('locataire_pages.quittances.title', 'Mes Quittances de Loyer');

  if (loading) {
    return (
      <div className="py-16 flex justify-center text-slate-400 dark:text-slate-500">
        <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {pageTitle}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('locataire_pages.quittances.subtitle', 'Téléchargez les reçus officiels de vos paiements validés.')}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input 
            type="text" 
            placeholder={t('locataire_pages.quittances.search_placeholder', 'Rechercher une période...')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {quittancesDisponibles.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
          <FileText size={48} className="mx-auto mb-4 text-slate-400 dark:text-slate-600" />
          <h3 className="text-slate-800 dark:text-slate-200 font-medium text-base mb-1">
            {t('locataire_pages.quittances.empty_title', 'Aucune quittance disponible')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('locataire_pages.quittances.empty_desc', "Les quittances s'affichent ici une fois vos paiements de loyer validés.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quittancesDisponibles.map(paiement => {
            const periode = new Date(paiement.date_echeance).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
            const datePaiement = paiement.date_paiement ? new Date(paiement.date_paiement).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR') : '-';
            const contratTitre = getContratTitre(paiement.contrat);
            
            // Résolution du contrat associé
            const contratId = typeof paiement.contrat === 'object' && paiement.contrat !== null
              ? (paiement.contrat as any).id
              : paiement.contrat;
            const c = contrats.find(c => c.id === contratId);

            const isAchat = (c?.type_contrat === 'ACHAT') || ((paiement as any).type_contrat === 'ACHAT') || (!c?.loyer && !(paiement as any).loyer_contrat && !!(c?.prix || (paiement as any).prix_contrat));
            const typeAchat = c?.type_paiement_achat || (paiement as any).type_paiement_achat;
            const prixVente = c?.prix || (paiement as any).prix_contrat;

            // Calcul du montant selon les règles :
            // - Achat payé en totalité : montant réglé = prix de vente du contrat
            // - Achat en tranches : montant réglé = montant payé de la tranche concernée
            // - Location : montant réglé = loyer du contrat (ou montant payé)
            let montantEffectif = 0;
            if (isAchat) {
              if (typeAchat === 'TOTALITE') {
                montantEffectif = parseFloat((prixVente || paiement.montant_paye || paiement.montant || '0').toString());
              } else {
                montantEffectif = parseFloat((paiement.montant_paye || paiement.montant || '0').toString());
              }
            } else {
              montantEffectif = parseFloat((c?.loyer || paiement.montant_paye || paiement.montant || '0').toString());
            }
            const montantFormat = formatMontantAr(montantEffectif);

            const numeroStr = paiement.id.toString().padStart(4, '0');

            // Détection acheteur vs vendeur
            let isVendeur = false;
            if (isAchat) {
              const currentUserId = currentUser?.id;
              const currentUserRole = currentUser?.role;
              const propUserId = (paiement as any).proprietaire_user_id || c?.proprietaire_user_id;
              const locUserId = paiement.locataire_user_id || c?.locataire_user_id;

              if (currentUserId && propUserId && currentUserId === propUserId) {
                isVendeur = true;
              } else if (currentUserId && locUserId && currentUserId === locUserId) {
                isVendeur = false;
              } else if (currentUserRole === 'PROPRIETAIRE') {
                isVendeur = true;
              } else if (currentUserRole === 'LOCATAIRE') {
                isVendeur = false;
              }
            }

            // Libellé officiel du type de transaction (Location, Achat, Vente)
            const typeTransaction = isAchat ? (isVendeur ? 'Vente' : 'Achat') : 'Location';

            // Titre de la carte selon le type et le destinataire
            let titreDocument = '';
            if (isAchat) {
              if (isVendeur) {
                titreDocument = typeAchat === 'PARTIEL'
                  ? `Reçu de vente (Tranche ${paiement.num_echeance || 1}/6) · N° ${numeroStr}`
                  : `Reçu de vente · N° ${numeroStr}`;
              } else {
                titreDocument = typeAchat === 'PARTIEL'
                  ? `Reçu d’achat (Tranche ${paiement.num_echeance || 1}/6) · N° ${numeroStr}`
                  : `Reçu d’achat · N° ${numeroStr}`;
              }
            } else {
              titreDocument = `${t('locataire_pages.quittances.receipt_prefix', 'Quittance')} ${periode}`;
            }

            return (
              <div 
                key={paiement.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <FileText size={20} className="shrink-0" />
                    <span className="text-slate-900 dark:text-white font-semibold text-base">
                      {titreDocument}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border dark:border-blue-500/30">
                      {typeTransaction}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
                      N° {numeroStr}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2.5 text-sm mb-6 flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      {t('locataire_pages.quittances.transaction_type', 'Type de transaction')} :
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                      {typeTransaction}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      {t('locataire_pages.quittances.concerned_property', 'Bien concerné')} :
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200 font-medium truncate text-right">
                      {contratTitre}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      {t('locataire_pages.quittances.paid_amount', 'Montant réglé')} :
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                      {montantFormat}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      {t('locataire_pages.quittances.payment_date', 'Date de règlement')} :
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200 font-medium">
                      {datePaiement}
                    </strong>
                  </div>
                </div>

                <button 
                  onClick={() => handleDownloadQuittance(paiement.id, isAchat)}
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download size={16} />
                  {t('locataire_pages.quittances.download_pdf', 'Télécharger le PDF')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
