import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ReportingData } from '../hooks/useReporting';

export function OccupancyOverview({ data }: { data: ReportingData }) {
  const biensDisponibles = data.biens.filter(b => b.statut === 'DISPONIBLE').length;
  const biensLoues = data.biens.filter(b => b.statut === 'LOUE').length;
  const biensEnTravaux = data.biens.filter(b => b.statut === 'EN_TRAVAUX').length;
  const biensVendus = data.biens.filter(b => b.statut === 'VENDU').length;
  const biensReserves = data.biens.filter(b => b.statut === 'RESERVE').length;

  const chartData = [
    { name: 'Disponible', value: biensDisponibles, color: '#3b82f6' },
    { name: 'Loué', value: biensLoues, color: '#22c55e' },
    { name: 'En travaux', value: biensEnTravaux, color: '#eab308' },
    { name: 'Vendu', value: biensVendus, color: '#64748b' },
    { name: 'Réservé', value: biensReserves, color: '#a855f7' },
  ].filter(item => item.value > 0);

  const totalLocatifs = biensDisponibles + biensLoues + biensEnTravaux + biensReserves;
  const tauxOccupation = totalLocatifs > 0 ? ((biensLoues / totalLocatifs) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border col-span-1 md:col-span-1">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Taux d'occupation</h3>
      
      <div className="flex flex-col items-center justify-center mb-4">
        <div className="text-3xl font-bold text-gray-800">{tauxOccupation}%</div>
        <div className="text-sm text-gray-500">Biens loués vs parc total louable</div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
