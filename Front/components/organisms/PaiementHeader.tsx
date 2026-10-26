'use client'

import React from 'react';
import { ShieldCheck, LockKeyhole } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function PaiementHeader() {
  const { t } = useTranslation();

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{t('locataire_pages.paiements.eyebrow', 'ESPACE PERSONNEL')}</p>
          <h1>{t('locataire_pages.paiements.header_title', 'Mes paiements & quittances')}</h1>
          <p className="subtitle">{t('locataire_pages.paiements.header_subtitle', "Consultez l'historique de vos loyers et téléchargez vos quittances en toute sécurité.")}</p>
        </div>
      </div>
      
      <div className="owner-banner">
        <div className="banner-icon"><ShieldCheck size={19} /></div>
        <div>
          <strong>{t('locataire_pages.paiements.banner_title', 'Accès sécurisé')}</strong>
          <p>{t('locataire_pages.paiements.banner_desc', "Vous n'avez accès qu'aux échéances relatives à vos propres contrats de location.")}</p>
        </div>
        <LockKeyhole size={17} />
      </div>
    </>
  );
}
