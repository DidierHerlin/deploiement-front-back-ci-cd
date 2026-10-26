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
          className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 bg-white/50 px-4 py-2 rounded-lg backdrop-blur-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("profile.back_to_dashboard", "Retour au tableau de bord")}
        </button>
      </div>
      <ProfilView />
    </div>
  );
}
