import React from 'react';
import { UserRound } from 'lucide-react';
import { getUserFullName } from "@/components/organisms/userUtils";
import { useTranslation } from '@/lib/i18n';

interface DashboardWelcomeProps {
  user: any;
  setShowProfile: (show: boolean) => void;
}

export function DashboardWelcome({ user, setShowProfile }: DashboardWelcomeProps) {
  const { t } = useTranslation();
  const fullName = getUserFullName(user, 'Locataire');

  return (
    <div className="welcome-row">
      <div>
        <h1>{t("dashboard.locataire.welcome", "Bonjour")} {fullName} 👋</h1>
        <p className="subtitle">{t("dashboard.locataire.welcome_desc", "Bienvenue sur votre espace locataire. Retrouvez ici votre bail, vos loyers et vos quittances.")}</p>
      </div>
      <button className="outline-button" onClick={() => setShowProfile(true)}>
        <UserRound size={15} />{t("dashboard.locataire.my_profile", "Mon profil")}
      </button>
    </div>
  );
}
