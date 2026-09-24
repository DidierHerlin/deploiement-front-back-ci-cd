import React from 'react';
import { UserRound, ShieldCheck, LockKeyhole } from 'lucide-react';

interface DashboardWelcomeProps {
  user: any;
  setShowProfile: (show: boolean) => void;
}

import { getUserFirstName } from "@/components/organisms/userUtils";

export function DashboardWelcome({ user, setShowProfile }: DashboardWelcomeProps) {
  const firstName = getUserFirstName(user);

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">ESPACE PERSONNEL</p>
          <h1>Bonjour {firstName}, <span>voici votre situation locative.</span></h1>
          <p className="subtitle">Retrouvez votre contrat, vos échéances et vos documents au même endroit.</p>
        </div>
        <button className="outline-button" onClick={() => setShowProfile(true)}>
          <UserRound size={15} />Mon profil
        </button>
      </div>
      
      <div className="admin-banner">
        <div className="banner-icon"><ShieldCheck size={19} /></div>
        <div>
          <strong>Vos données sont confidentielles</strong>
          <p>Votre espace est strictement personnel. Les informations affichées concernent uniquement votre dossier locataire.</p>
        </div>
        <LockKeyhole size={17} />
      </div>
    </>
  );
}
