'use client'

import React, { useState } from 'react';
import { ArrowDownToLine, Loader2 } from 'lucide-react';
import { getProfil } from '@/lib/api'; 


export function ContratDownloadButton({ contratId, typeContrat }: { contratId: number, typeContrat: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (typeContrat !== 'LOCATION') {
    return null; 
  }

  const handleDownload = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { fetchBlob } = await import('@/lib/api');
      const blob = await fetchBlob(`/contrats/${contratId}/telecharger/`);

      const filename = `Contrat_Bail_${contratId}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            } catch (err: any) {
               setError(err.message);
            } finally {
              setLoading(false); 
        }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
      <button 
        className="primary-button outline-button" 
        onClick={handleDownload}
        disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
        {loading ? 'Génération en cours...' : 'Télécharger le contrat'}
      </button>
      {error && <small style={{ color: 'red' }}>{error}</small>}
    </div>
  );
}
