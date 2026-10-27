'use client'

import { Users, Home, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import { ReportingData } from '../hooks/useReporting';
import { useTranslation } from '@/lib/i18n';

export function ReportingStats({ data }: { data: ReportingData }) {
  const { t } = useTranslation();
  const totalBiens = data.biens.length;
  const biensDisponibles = data.biens.filter(b => b.statut === 'DISPONIBLE').length;
  const biensLoues = data.biens.filter(b => b.statut === 'LOUE').length;
  
  const contratsActifs = data.contrats.filter(c => c.statut === 'ACTIF').length;
  const contratsLocationActifs = data.contrats.filter(c => c.type_contrat === 'LOCATION' && c.statut === 'ACTIF').length;

  const paiementsAttente = data.paiements.filter(p => p.statut === 'EN_ATTENTE').length;
  const paiementsRetard = data.impayes.length;

  const revenusPaiements = data.paiements.filter(p => p.statut === 'PAYE');
  const totalRevenus = revenusPaiements.reduce((acc, curr) => acc + parseFloat(curr.montant || '0'), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-slate-200">
            {t('admin.reporting.stat_biens', 'Biens')}
          </h3>
          <Home className="text-blue-500 w-5 h-5" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBiens}</p>
        <div className="text-sm text-gray-500 dark:text-slate-400 mt-2 flex justify-between">
          <span>{biensLoues} {t('admin.reporting.stat_loues', 'loués')}</span>
          <span>{biensDisponibles} {t('admin.reporting.stat_dispos', 'dispos')}</span>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-slate-200">
            {t('admin.reporting.stat_contrats_actifs', 'Contrats Actifs')}
          </h3>
          <FileText className="text-green-500 w-5 h-5" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{contratsActifs}</p>
        <div className="text-sm text-gray-500 dark:text-slate-400 mt-2">
          {contratsLocationActifs} {t('admin.reporting.stat_locations', 'locations')}
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-slate-200">
            {t('admin.reporting.stat_paiements', 'Paiements')}
          </h3>
          <AlertCircle className="text-amber-500 w-5 h-5" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{paiementsAttente}</p>
        <div className="text-sm mt-2 text-red-600 dark:text-red-400 font-medium">
          {paiementsRetard} {t('admin.reporting.stat_en_retard_impayes', 'en retard / impayés')}
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-slate-200">
            {t('admin.reporting.stat_revenus_globaux', 'Revenus Globaux')}
          </h3>
          <span className="text-purple-500 font-bold text-sm">Ar</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRevenus.toLocaleString('fr-MG')} Ar</p>
        <div className="text-sm text-gray-500 dark:text-slate-400 mt-2 flex items-center">
          <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
          <span>{t('admin.reporting.stat_payes_total', 'Payés (total)')}</span>
        </div>
      </div>
    </div>
  );
}
