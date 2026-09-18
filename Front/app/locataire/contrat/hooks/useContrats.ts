import { useState, useEffect } from 'react';
import { getContrats, Contrat } from '@/lib/api';

export function useContrats() {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const dataContrats = await getContrats();

        if (mounted) {
          setContrats(dataContrats || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Une erreur inconnue est survenue');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  return { contrats, loading, error };
}
