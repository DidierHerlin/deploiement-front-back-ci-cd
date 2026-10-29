'use client'

import React from 'react';
import Link from 'next/link';
import { Building2, FileText, Loader2, AlertCircle, Home } from 'lucide-react';
import { Contrat } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface DashboardContratCardProps {
  contrat: Contrat | null;
  loading: boolean;
  error: string | null;
}

export function DashboardContratCard({ contrat, loading, error }: DashboardContratCardProps) {
  const { t, lang } = useTranslation();

  if (loading) {
    return (
      <section className="panel contract-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Loader2 className="animate-spin" size={24} color="var(--text-secondary)" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel contract-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={32} color="var(--error)" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
      </section>
    );
  }

  if (!contrat) {
    return (
      <section className="panel contract-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px', padding: '2.5rem 1.5rem', textAlign: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.25rem'
        }} className="dark:bg-blue-950/50 dark:text-blue-400">
          <Home size={26} strokeWidth={1.8} />
        </div>
        <h3 className="text-slate-900 dark:text-white font-semibold text-base m-0">
          {t('dashboard.locataire.no_rented_home', 'Aucun logement loué actuellement')}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed m-0 max-w-[420px]">
          {t('dashboard.locataire.browse_properties_hint', 'Vous cherchez un appartement ou une maison ? Parcourez nos annonces disponibles et faites une demande de visite en ligne.')}
        </p>
        <Link 
          href="/locataire/biens" 
          className="primary-button" 
          style={{ marginTop: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Building2 size={16} />
          <span>{t('dashboard.locataire.browse_properties_cta', 'Voir les biens disponibles')}</span>
        </Link>
      </section>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <section className="panel contract-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="panel-header">
        <div>
          <h2 className="text-slate-900 dark:text-white font-semibold text-sm sm:text-base m-0">{t('dashboard.locataire.current_contract', 'Mon contrat en cours')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Contrat #{contrat.id} — {t('locataire_pages.reservations.submitted_on', 'Créé le')} {formatDate(contrat.date_creation)}</p>
        </div>
        <span className="status paid"><i />{contrat.statut}</span>
      </div>
      <div className="property-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 flex items-center gap-3.5 transition-colors">
        <div className="property-image dark:bg-slate-800 dark:text-blue-400 flex-shrink-0"><Building2 size={27} /></div>
        <div className="min-w-0 flex-1">
          <strong className="text-slate-900 dark:text-white block text-sm font-semibold truncate">{contrat.bien_titre}</strong>
          <p className="text-slate-500 dark:text-slate-400 text-xs my-0.5">{contrat.bien_type}</p>
          <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{t('locataire_pages.contrat.card_rent', 'Loyer mensuel')} : {parseFloat(contrat.loyer || '0').toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar</span>
        </div>
      </div>
      <div className="contract-details border-b border-slate-100 dark:border-slate-800 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.start_date', 'Date de début')}</span><strong className="text-slate-900 dark:text-white text-xs sm:text-sm font-medium">{formatDate(contrat.date_debut)}</strong></div>
        {contrat.date_fin && (
          <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t('locataire_pages.contrat.end_date', 'Échéance du bail')}</span><strong className="text-slate-900 dark:text-white text-xs sm:text-sm font-medium">{formatDate(contrat.date_fin)}</strong></div>
        )}
      </div>
      <div className="panel-actions pt-4">
        <button className="outline-button dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => window.location.href = '/locataire/contrat'}>
          <FileText size={15} />{t('dashboard.locataire.view_all_contracts', 'Voir tous mes contrats')}
        </button>
      </div>
    </section>
  );
}
