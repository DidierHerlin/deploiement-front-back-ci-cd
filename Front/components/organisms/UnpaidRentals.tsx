'use client'

import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ReportingData } from '../hooks/useReporting';
import { useTranslation } from '@/lib/i18n';

export function UnpaidRentals({ data }: { data: ReportingData }) {
  const { t, lang } = useTranslation();
  const dateLocale = lang === 'en' ? enUS : fr;

  if (data.impayes.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {t('admin.reporting.unpaid_retards_title', 'Impayés & Retards')}
        </h3>
        <p className="text-gray-500">
          {t('admin.reporting.no_unpaid', 'Aucun paiement en retard ou impayé.')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border mt-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {t('admin.reporting.unpaid_retards_title', 'Impayés & Retards')} ({data.impayes.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">{t('admin.reporting.col_contrat_id', 'Contrat ID')}</th>
              <th className="px-4 py-3">{t('admin.reporting.col_echeance', 'Échéance')}</th>
              <th className="px-4 py-3">{t('admin.reporting.col_montant_attendu', 'Montant Attendu')}</th>
              <th className="px-4 py-3">{t('admin.reporting.col_reste_a_payer', 'Reste à payer')}</th>
              <th className="px-4 py-3">{t('admin.reporting.col_statut', 'Statut')}</th>
            </tr>
          </thead>
          <tbody>
            {data.impayes.map((p, idx) => (
              <tr key={p.id || idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {p.contrat}
                </td>
                <td className="px-4 py-3">
                  {p.date_echeance ? format(parseISO(p.date_echeance), 'dd MMM yyyy', { locale: dateLocale }) : '-'}
                </td>
                <td className="px-4 py-3">
                  {p.montant_attendu ? `${parseFloat(p.montant_attendu).toLocaleString('fr-MG')} Ar` : '-'}
                </td>
                <td className="px-4 py-3 font-semibold text-red-600">
                  {p.montant_restant !== undefined && p.montant_restant !== null 
                    ? `${parseFloat(p.montant_restant).toLocaleString('fr-MG')} Ar` 
                    : `${parseFloat(p.montant || '0').toLocaleString('fr-MG')} Ar`}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    p.statut === 'EN_RETARD' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.statut.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
