import { useState, useEffect, useCallback } from 'react';
import {
  getPaiements,
  getNotifications,
  getDemandesPaiement,
  getFacturesEligibles,
  Paiement,
  Notification,
  DemandePaiement,
} from '@/lib/api';

export function usePaiements() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [demandes, setDemandes] = useState<DemandePaiement[]>([]);
  const [facturesEligibles, setFacturesEligibles] = useState<Paiement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataPaiements, dataNotifications, dataDemandes, dataEligibles] = await Promise.all([
        getPaiements(),
        getNotifications().catch(() => []),
        getDemandesPaiement().catch(() => []),
        getFacturesEligibles().then((r) => r.results).catch(() => []),
      ]);

      setPaiements(dataPaiements || []);
      setNotifications(dataNotifications || []);
      setDemandes(dataDemandes || []);
      setFacturesEligibles(dataEligibles || []);
    } catch (err: any) {
      setError(err.message || 'Une erreur inconnue est survenue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    paiements,
    demandes,
    facturesEligibles,
    notifications,
    loading,
    error,
    refetch: fetchData,
  };
}

