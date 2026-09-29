import { useState, useEffect } from 'react';
import { getAgentDashboardStats } from '@/lib/api';

export interface AgentDashboardData {
  biens: {
    total: number;
    dispo: number;
    loue: number;
    travaux: number;
  };
  revenus: {
    currentMonth: number;
    lastMonth: number;
    chartData: Array<{ name: string; Revenus: number }>;
  };
  impayes: {
    totalAmount: number;
    totalLocataires: number;
    list: Array<{
      id: number;
      locataire_nom: string;
      bien_titre: string;
      montant: number;
      date_echeance: string;
    }>;
  };
  upcomingContracts: Array<{
    id: number;
    locataire_nom: string;
    bien_titre: string;
    date_fin: string;
  }>;
}

export function useAgentDashboard() {
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const stats = await getAgentDashboardStats();
        setData(stats);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des données du tableau de bord");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}
