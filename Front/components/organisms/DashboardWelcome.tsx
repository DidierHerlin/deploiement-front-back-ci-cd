import React from 'react';
import { UserRound, ShieldCheck, LockKeyhole } from 'lucide-react';
import { getUserFirstName } from "@/components/organisms/userUtils";
import { useTranslation } from '@/lib/i18n';

interface DashboardWelcomeProps {
  user: any;
  setShowProfile: (show: boolean) => void;
}

export function DashboardWelcome({ user, setShowProfile }: DashboardWelcomeProps) {
  const { t } = useTranslation();
  const firstName = getUserFirstName(user);

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{t("dashboard.locataire.eyebrow", "ESPACE PERSONNEL")}</p>
          <h1>{t("dashboard.locataire.welcome", "Bonjour")} {firstName}, <span>{t("dashboard.locataire.welcome_sub", "voici votre situation locative.")}</span></h1>
          <p className="subtitle">{t("dashboard.locataire.welcome_desc", "Retrouvez votre contrat, vos échéances et vos documents au même endroit.")}</p>
        </div>
        <button className="outline-button" onClick={() => setShowProfile(true)}>
          <UserRound size={15} />{t("dashboard.locataire.my_profile", "Mon profil")}
        </button>
      </div>
      
      <div className="admin-banner">
        <div className="banner-icon"><ShieldCheck size={19} /></div>
        <div>
          <strong>{t("dashboard.locataire.confidential_title", "Vos données sont confidentielles")}</strong>
          <p>{t("dashboard.locataire.confidential_desc", "Votre espace est strictement personnel. Les informations affichées concernent uniquement votre dossier locataire.")}</p>
        </div>
        <LockKeyhole size={17} />
      </div>
    </>
  );
}
