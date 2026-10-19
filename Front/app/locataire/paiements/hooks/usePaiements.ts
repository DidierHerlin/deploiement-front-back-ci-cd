import { useState, useEffect, useCallback } from 'react';
import {
  getPaiements,
  getPaiementsStats,
  getNotifications,
  getDemandesPaiement,
  getFacturesEligibles,
  Paiement,
  PaiementStatsData,
  Notification,
  DemandePaiement,
} from '@/lib/api';

export function usePaiements(userId?: number) {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [stats, setStats] = useState<PaiementStatsData | null>(null);
  const [demandes, setDemandes] = useState<DemandePaiement[]>([]);
  const [facturesEligibles, setFacturesEligibles] = useState<Paiement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataPaiements, dataStats, dataNotifications, dataDemandes, dataEligibles] = await Promise.all([
        getPaiements(),
        getPaiementsStats(userId).catch(() => null),
        getNotifications().catch(() => []),
        getDemandesPaiement().catch(() => []),
        getFacturesEligibles().then((r) => r.results).catch(() => []),
      ]);

      setPaiements(dataPaiements || []);
      setStats(dataStats);
      setNotifications(dataNotifications || []);
      setDemandes(dataDemandes || []);
      setFacturesEligibles(dataEligibles || []);
    } catch (err: any) {
      setError(err.message || 'Une erreur inconnue est survenue');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    paiements,
    stats,
    demandes,
    facturesEligibles,
    notifications,
    loading,
    error,
    refetch: fetchData,
  };
}


