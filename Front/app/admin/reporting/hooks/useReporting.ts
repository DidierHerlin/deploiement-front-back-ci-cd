import { useState, useEffect, useCallback } from 'react';
import {
  getBiens,
  getContrats,
  getPaiements,
  getImpayes,
  getEcheances,
  Bien,
  Contrat,
  Paiement
} from '@/lib/api';

export interface ReportingData {
  biens: Bien[];
  contrats: Contrat[];
  paiements: Paiement[];
  impayes: Paiement[];
  echeances: any[];
}

export function useReporting() {
  const [data, setData] = useState<ReportingData>({
    biens: [],
    contrats: [],
    paiements: [],
    impayes: [],
    echeances: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // RG-19 : Les données sont recalculées en temps réel à chaque consultation du tableau de bord.
      // Récupération des données fraîches
      const [
        biensRes,
        contratsRes,
        paiementsRes,
        impayesRes,
        echeancesRes
      ] = await Promise.all([
        getBiens(),
        getContrats(),
        getPaiements(),
        getImpayes(),
        getEcheances()
      ]);

      setData({
        biens: Array.isArray(biensRes) ? biensRes : [],
        contrats: Array.isArray(contratsRes) ? contratsRes : [],
        paiements: Array.isArray(paiementsRes) ? paiementsRes : [],
        impayes: Array.isArray(impayesRes) ? impayesRes : [],
        echeances: Array.isArray(echeancesRes) ? echeancesRes : [],
      });
    } catch (err: any) {
      console.error('Erreur lors du chargement des données de reporting:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportingData();
  }, [fetchReportingData]);

  return { data, loading, error, refresh: fetchReportingData };
}
