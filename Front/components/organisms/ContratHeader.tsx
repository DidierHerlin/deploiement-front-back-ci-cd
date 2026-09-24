'use client'

import React from 'react';
import { ShieldCheck, LockKeyhole } from 'lucide-react';

export function ContratHeader() {
  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">ESPACE PERSONNEL</p>
          <h1>Vos contrats de location</h1>
          <p className="subtitle">Consultez vos contrats et vos échéances en toute sécurité.</p>
        </div>
      </div>
      
      <div className="owner-banner">
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
