'use client'

import React from 'react';
import { ShieldCheck, LockKeyhole } from 'lucide-react';

export function PaiementHeader() {
  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">ESPACE PERSONNEL</p>
          <h1>Mes paiements & quittances</h1>
          <p className="subtitle">Consultez l'historique de vos loyers et téléchargez vos quittances en toute sécurité.</p>
        </div>
      </div>
      
      <div className="owner-banner">
        <div className="banner-icon"><ShieldCheck size={19} /></div>
        <div>
          <strong>Accès sécurisé </strong>
          <p>Vous n'avez accès qu'aux échéances relatives à vos propres contrats de location.</p>
        </div>
        <LockKeyhole size={17} />
      </div>
    </>
  );
}
