'use client'

import React from 'react';
import { ShieldCheck, LockKeyhole } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function ContratHeader() {
  const { t } = useTranslation();

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{t('locataire_pages.contrat.eyebrow', 'ESPACE PERSONNEL')}</p>
          <h1>{t('locataire_pages.contrat.header_title', 'Vos contrats de location')}</h1>
          <p className="subtitle">{t('locataire_pages.contrat.header_subtitle', 'Consultez vos contrats et vos échéances en toute sécurité.')}</p>
        </div>
      </div>
      
      <div className="owner-banner">
        <div className="banner-icon"><ShieldCheck size={19} /></div>
        <div>
          <strong>{t('locataire_pages.contrat.confidential_title', 'Vos données sont confidentielles')}</strong>
          <p>{t('locataire_pages.contrat.confidential_desc', 'Votre espace est strictement personnel. Les informations affichées concernent uniquement votre dossier locataire.')}</p>
        </div>
        <LockKeyhole size={17} />
      </div>
    </>
  );
}
