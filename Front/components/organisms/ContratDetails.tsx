'use client'

import React from 'react';
import { X, FileText, UserRound, Building2, CircleDollarSign } from 'lucide-react';
import { Contrat } from '@/lib/api';
import { ContratStatusBadge } from "@/components/atoms/ContratStatusBadge";
import { ContratDownloadButton } from "@/components/atoms/ContratDownloadButton";
import { useTranslation } from '@/lib/i18n';

interface ContratDetailsProps {
  contrat: Contrat;
  onClose: () => void;
}

export function ContratDetails({ contrat, onClose }: ContratDetailsProps) {
  const { t, lang } = useTranslation();
  const isLocation = contrat.type_contrat === 'LOCATION';
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR');
  };

  const formatMontant = (montant: any) => {
    return montant ? `${parseFloat(montant).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar` : 'N/A';
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="presentation">
      <section 
        className="modal profile-modal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="details-title"
      >
        {/* Header */}
        <div className="p-6 pb-4 relative border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/60 dark:bg-slate-950/40">
          <button 
            className="modal-close cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg p-1.5 transition-colors absolute top-5 right-5 text-slate-400 hover:text-slate-600" 
            onClick={onClose} 
            aria-label={t('common.close', 'Fermer')}
          >
            <X size={18} />
          </button>
          <div className="modal-icon dark:bg-slate-800 dark:text-blue-400">
            <FileText size={20} />
          </div>
          <h2 id="details-title" className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-0 mt-3">
            {t('locataire_pages.contrat.details_title', 'Détails du contrat #{id}', { id: contrat.id })}
          </h2>
        </div>
        
        {/* Body */}
        <div className="p-6 py-4 overflow-y-auto flex-1 space-y-5">
          <div>
            <h3 className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-2">
              <FileText size={15}/> {t('locataire_pages.contrat.contract_info', 'Informations contractuelles')}
            </h3>
            <div className="profile-fields grid grid-cols-2 gap-4">
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.ref', 'Référence')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">#{contrat.id}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.type', 'Type')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{isLocation ? t('types.location', 'Location') : t('types.sale', 'Achat')}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.status', 'Statut')}</span><ContratStatusBadge statut={contrat.statut} /></div>
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.start_date', 'Date de début')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{formatDate(contrat.date_debut)}</strong></div>
              {isLocation && <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.end_date', 'Date de fin')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{formatDate(contrat.date_fin)}</strong></div>}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-2">
              <Building2 size={15}/> {t('locataire_pages.contrat.property_concerned', 'Bien concerné')}
            </h3>
            <div className="profile-fields grid grid-cols-2 gap-4">
              <div className="col-span-2"><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.property_title', 'Titre')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{contrat.bien_titre}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.property_type', 'Type')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{contrat.bien_type}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.property_address', 'Adresse')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">Selon dossier du bien</strong></div>
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-2">
              <CircleDollarSign size={15}/> {t('locataire_pages.contrat.financial_info', 'Informations financières')}
            </h3>
            <div className="profile-fields grid grid-cols-2 gap-4">
              {isLocation ? (
                <>
                  <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.card_rent', 'Loyer mensuel')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{formatMontant(contrat.loyer)}</strong></div>
                  <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.card_deposit', 'Dépôt de garantie')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{formatMontant(contrat.depot_garantie)}</strong></div>
                </>
              ) : (
                <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">Prix de vente</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{formatMontant(contrat.prix)}</strong></div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-2">
              <UserRound size={15}/> {t('locataire_pages.contrat.parties_concerned', 'Parties concernées')}
            </h3>
            <div className="profile-fields grid grid-cols-1 gap-4">
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.tenant', 'Locataire')}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{contrat.locataire_prenoms} {contrat.locataire_nom}</strong></div>
            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center flex-shrink-0 bg-slate-50/60 dark:bg-slate-950/40">
          <ContratDownloadButton contratId={contrat.id} typeContrat={contrat.type_contrat} />
          <button className="primary-button cursor-pointer" onClick={onClose}>{t('common.close', 'Fermer')}</button>
        </div>
      </section>
    </div>
  );
}
