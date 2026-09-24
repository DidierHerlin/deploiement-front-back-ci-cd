import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export function LoadingState() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
      <Loader2 size={32} className="animate-spin" style={{ marginBottom: '16px' }} />
      <p>Analyse des données en cours...</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: string, onRetry: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--red)' }}>
      <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
      <h3 style={{ marginBottom: '8px', color: 'var(--navy)' }}>Erreur de chargement</h3>
      <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{error}</p>
      <button onClick={onRetry} className="primary-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <RefreshCw size={16} /> Réessayer
      </button>
    </div>
  );
}
