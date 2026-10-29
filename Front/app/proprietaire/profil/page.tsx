"use client";

import ProfilView from "@/components/organisms/ProfilView";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

export default function ProprietaireProfilPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-4xl mb-6 flex justify-start">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("profile.back_to_dashboard", "Retour au tableau de bord")}
        </button>
      </div>
      <ProfilView />
    </div>
  );
}
