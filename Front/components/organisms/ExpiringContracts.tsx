'use client'

import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ReportingData } from '../hooks/useReporting';
import { useTranslation } from '@/lib/i18n';

export function ExpiringContracts({ data }: { data: ReportingData }) {
  const { t, lang } = useTranslation();
  const dateLocale = lang === 'en' ? enUS : fr;

  if (data.echeances.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {t('admin.reporting.expiring_title', 'Échéances à venir (J-5)')}
        </h3>
        <p className="text-gray-500">
          {t('admin.reporting.no_expiring', 'Aucune échéance prévue dans les 5 prochains jours.')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border mt-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {t('admin.reporting.expiring_title', 'Échéances à venir (J-5)')} ({data.echeances.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">{t('admin.reporting.col_contrat_id', 'Contrat ID')}</th>
              <th className="px-4 py-3">{t('admin.reporting.col_echeance', "Date d'échéance")}</th>
              <th className="px-4 py-3">{t('admin.reporting.col_montant_attendu', 'Montant Attendu')}</th>
              <th className="px-4 py-3">{t('admin.reporting.col_reste_a_payer', 'Reste à Payer')}</th>
            </tr>
          </thead>
          <tbody>
            {data.echeances.map((e, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {e.contrat_id}
                </td>
                <td className="px-4 py-3">
                  {e.date_echeance ? format(parseISO(e.date_echeance), 'dd MMM yyyy', { locale: dateLocale }) : '-'}
                </td>
                <td className="px-4 py-3">
                  {e.montant_attendu ? `${parseFloat(e.montant_attendu).toLocaleString('fr-MG')} Ar` : '-'}
                </td>
                <td className="px-4 py-3 font-semibold text-amber-600">
                  {e.montant_restant ? `${parseFloat(e.montant_restant).toLocaleString('fr-MG')} Ar` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
