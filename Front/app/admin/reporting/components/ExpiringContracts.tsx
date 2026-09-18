import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReportingData } from '../hooks/useReporting';

export function ExpiringContracts({ data }: { data: ReportingData }) {
  if (data.echeances.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Échéances à venir (J-5)</h3>
        <p className="text-gray-500">Aucune échéance prévue dans les 5 prochains jours.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border mt-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Échéances à venir ({data.echeances.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Contrat ID</th>
              <th className="px-4 py-3">Date d'échéance</th>
              <th className="px-4 py-3">Montant Attendu</th>
              <th className="px-4 py-3">Reste à Payer</th>
            </tr>
          </thead>
          <tbody>
            {data.echeances.map((e, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {e.contrat_id}
                </td>
                <td className="px-4 py-3">
                  {e.date_echeance ? format(parseISO(e.date_echeance), 'dd MMM yyyy', { locale: fr }) : '-'}
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
