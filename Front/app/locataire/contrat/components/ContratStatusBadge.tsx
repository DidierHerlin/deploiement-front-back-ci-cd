import React from 'react';

export function ContratStatusBadge({ statut }: { statut: string }) {
  let badgeClass = 'status';
  let label = statut;

  switch (statut) {
    case 'ACTIF':
      badgeClass += ' paid'; // Vert
      label = 'Actif';
      break;
    case 'RESILIE':
      badgeClass += ' failed'; // Rouge/Gris selon CSS
      label = 'Résilié';
      break;
    case 'TERMINE':
      badgeClass += ' default'; // Gris
      label = 'Terminé';
      break;
    default:
      badgeClass += ' default';
  }

  return (
    <span className={badgeClass}>
      <i />{label}
    </span>
  );
}

export function EcheanceStatusBadge({ statut }: { statut: string }) {
  let badgeClass = 'status';
  let label = statut;

  switch (statut) {
    case 'PAYE':
      badgeClass += ' paid';
      label = 'Payé';
      break;
    case 'EN_ATTENTE':
      badgeClass += ' pending'; // Orange
      label = 'En attente';
      break;
    case 'EN_RETARD':
      badgeClass += ' failed'; // Rouge
      label = 'En retard';
      break;
    case 'PARTIEL':
      badgeClass += ' pending';
      label = 'Partiel';
      break;
    default:
      badgeClass += ' default';
  }

  return (
    <span className={badgeClass}>
      <i />{label}
    </span>
  );
}
