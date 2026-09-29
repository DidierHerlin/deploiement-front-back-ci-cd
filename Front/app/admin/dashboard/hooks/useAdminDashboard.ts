import { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '@/lib/api';

export interface AdminDashboardData {
  biens: {
    total: number;
    maisons: number;
    appartements: number;
    terrains: number;
    locations: number;
    ventes: number;
    dispo: number;
    loue: number;
    vendu: number;
    travaux: number;
  };
  contrats: {
    total: number;
    actifs: number;
    expiring: number;
    locations: number;
    ventes: number;
  };
  paiements: {
    valides: number;
    enAttente: number;
    enRetard: number;
    partiels: number;
    totalRevenus: number;
    totalAttendu: number;
  };
  utilisateurs: {
    total: number;
    admins: number;
    agents: number;
    proprietaires: number;
    locataires: number;
  };
  recentEvents: Array<{
    id: string;
    type: string;
    date: string;
    title: string;
    text: string;
    icon: any;
    color: string;
  }>;
}

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const stats = await getAdminDashboardStats();
        setData(stats);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des donnes du tableau de bord");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}
