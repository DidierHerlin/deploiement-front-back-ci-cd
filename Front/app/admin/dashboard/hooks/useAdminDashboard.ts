import { useState, useEffect } from 'react';
import { 
  getBiens, 
  getContrats, 
  getPaiements, 
  getAllUsers, 
  getProprietaires, 
  getLocataires,
  Bien,
  Contrat,
  Paiement,
  UserProfil,
  Proprietaire,
  Locataire
} from '@/lib/api';

export interface AdminDashboardData {
  biens: Bien[];
  contrats: Contrat[];
  paiements: Paiement[];
  users: UserProfil[];
  proprietaires: Proprietaire[];
  locataires: Locataire[];
}

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [biens, contrats, paiements, users, proprietaires, locataires] = await Promise.all([
          getBiens(),
          getContrats(),
          getPaiements(),
          getAllUsers(),
          getProprietaires(),
          getLocataires()
        ]);

        setData({
          biens,
          contrats,
          paiements,
          users,
          proprietaires,
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
