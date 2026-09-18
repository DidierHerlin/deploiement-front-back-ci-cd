import { useState, useEffect, useCallback } from 'react';
import { getPaiements, getNotifications, Paiement, Notification } from '@/lib/api';

export function usePaiements() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataPaiements, dataNotifications] = await Promise.all([
        getPaiements(),
        getNotifications().catch(() => []) // Fallback si l'API notification échoue
      ]);

      setPaiements(dataPaiements || []);
      setNotifications(dataNotifications || []);
    } catch (err: any) {
      setError(err.message || 'Une erreur inconnue est survenue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { paiements, notifications, loading, error, refetch: fetchData };
}
