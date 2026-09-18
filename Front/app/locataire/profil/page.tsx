"use client";

import ProfilView from "@/components/profil/ProfilView";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LocataireProfilPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex flex-col p-4 sm:p-8 items-center">
      <div className="w-full max-w-4xl mb-6 flex justify-start">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 bg-white/50 px-4 py-2 rounded-lg backdrop-blur-sm transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au tableau de bord
        </button>
      </div>
      <ProfilView />
    </div>
  );
}
