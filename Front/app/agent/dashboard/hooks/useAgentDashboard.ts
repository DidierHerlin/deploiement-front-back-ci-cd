import { useState, useEffect } from 'react';
import { 
  getBiens, 
  getContrats, 
  getPaiements, 
  getLocataires,
  Bien,
  Contrat,
  Paiement,
  Locataire
} from '@/lib/api';

export interface AgentDashboardData {
  biens: Bien[];
  contrats: Contrat[];
  paiements: Paiement[];
  locataires: Locataire[];
}

export function useAgentDashboard() {
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [biens, contrats, paiements, locataires] = await Promise.all([
          getBiens(),
          getContrats(),
          getPaiements(),
          getLocataires()
        ]);

        setData({
          biens,
          contrats,
          paiements,
          locataires
        });
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
