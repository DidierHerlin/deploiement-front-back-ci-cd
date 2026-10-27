import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[50vh] text-slate-500 dark:text-slate-400">
      <Loader2 size={32} className="animate-spin mb-4 text-blue-600 dark:text-blue-400" />
      <p className="text-sm">{t("forms.loading", "Analyse des données en cours...")}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: string, onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[50vh] text-rose-500">
      <AlertCircle size={48} className="mb-4 opacity-50" />
      <h3 className="mb-2 text-slate-900 dark:text-white font-semibold">{t("forms.error", "Erreur de chargement")}</h3>
      <p className="mb-6 text-slate-500 dark:text-slate-400 text-sm">{error}</p>
      <button onClick={onRetry} className="primary-button flex items-center gap-2">
        <RefreshCw size={16} /> {t("forms.retry", "Réessayer")}
      </button>
    </div>
  );
}
