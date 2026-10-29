"use client";

import React, { useEffect, useState } from "react";
import { getProfil, UserProfil } from "@/lib/api";
import ProfilForm from "@/components/organisms/ProfilForm";
import { useTranslation } from "@/lib/i18n";

export default function ProfilView() {
  const { t } = useTranslation();
  const [profil, setProfil] = useState<UserProfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const data = await getProfil();
        setProfil(data);
      } catch (err: any) {
        setError(err.message || t("profile.error_loading", "Erreur lors du chargement du profil"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfil();
  }, [t]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold">{t("profile.error_title", "Erreur")}</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden max-w-4xl w-full">
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white border-b pb-4 border-slate-100 dark:border-slate-800">
          {t("profile.personal_info", "Informations Personnelles")}
        </h2>
        {profil && (
          <ProfilForm 
            initialData={profil} 
            onUpdate={(updatedProfil) => setProfil(updatedProfil)} 
          />
        )}
      </div>
    </div>
  );
}
