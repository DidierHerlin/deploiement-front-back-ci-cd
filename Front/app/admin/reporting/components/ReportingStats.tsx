import { Users, Home, FileText, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { ReportingData } from '../hooks/useReporting';

export function ReportingStats({ data }: { data: ReportingData }) {
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
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Biens</h3>
          <Home className="text-blue-500 w-5 h-5" />
        </div>
        <p className="text-2xl font-bold">{totalBiens}</p>
        <div className="text-sm text-gray-500 mt-2 flex justify-between">
          <span>{biensLoues} loués</span>
          <span>{biensDisponibles} dispos</span>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Contrats Actifs</h3>
          <FileText className="text-green-500 w-5 h-5" />
        </div>
        <p className="text-2xl font-bold">{contratsActifs}</p>
        <div className="text-sm text-gray-500 mt-2">
          {contratsLocationActifs} locations
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Paiements</h3>
          <AlertCircle className="text-amber-500 w-5 h-5" />
        </div>
        <p className="text-2xl font-bold">{paiementsAttente}</p>
        <div className="text-sm text-gray-500 mt-2 text-red-500 font-medium">
          {paiementsRetard} en retard / impayés
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Revenus Globaux</h3>
          <DollarSign className="text-purple-500 w-5 h-5" />
        </div>
        <p className="text-2xl font-bold">{totalRevenus.toLocaleString('fr-MG')} Ar</p>
        <div className="text-sm text-gray-500 mt-2 flex items-center">
          <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
          <span>Payés (total)</span>
        </div>
      </div>
    </div>
  );
}
