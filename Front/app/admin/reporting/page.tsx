'use client';

import { RefreshCw } from 'lucide-react';
import { useReporting } from './hooks/useReporting';
import { ReportingStats } from './components/ReportingStats';
import { OccupancyOverview } from './components/OccupancyOverview';
import { RevenueChart } from './components/RevenueChart';
import { UnpaidRentals } from './components/UnpaidRentals';
import { ExpiringContracts } from './components/ExpiringContracts';
import { ExportReports } from './components/ExportReports';

export default function ReportingPage() {
  const { data, loading, error, refresh } = useReporting();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg text-gray-600">Chargement des données en temps réel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <h3 className="text-red-800 font-bold">Erreur</h3>
          <p className="text-red-700 mt-1">{error}</p>
          <button 
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting Administrateur</h1>
          <p className="text-gray-500 mt-1">Supervision de l'activité immobilière et financière</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={refresh}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      <ExportReports data={data} />
      
      <ReportingStats data={data} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <OccupancyOverview data={data} />
        <RevenueChart data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UnpaidRentals data={data} />
        <ExpiringContracts data={data} />
      </div>
    </div>
  );
}
