import { Paiement } from './api'

export type MobileMoneyOperator = 'MVOLA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY'

export const MOBILE_MONEY_OPERATORS: MobileMoneyOperator[] = [
  'MVOLA',
  'ORANGE_MONEY',
  'AIRTEL_MONEY',
]

/**
 * Détecte si un mode de paiement correspond à un opérateur Mobile Money
 * Gère les variantes de casse et les libellés usuels (ex: "AIRTEL_MONEY", "Airtel Money", "MVola", "Orange")
 */
export function isMobileMoneyMode(mode?: string | null): boolean {
  if (!mode) return false
  const m = mode.trim().toUpperCase().replace(/[\s-_]+/g, '_')
  return (
    m === 'MVOLA' ||
    m.includes('VOLA') ||
    m === 'ORANGE_MONEY' ||
    m.includes('ORANGE') ||
    m === 'AIRTEL_MONEY' ||
    m.includes('AIRTEL')
  )
}

/**
 * Normalise l'opérateur Mobile Money vers 'MVOLA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY'
 */
export function getMobileMoneyOperator(mode?: string | null): MobileMoneyOperator | null {
  if (!mode) return null
  const m = mode.trim().toUpperCase().replace(/[\s-_]+/g, '_')
  if (m === 'MVOLA' || m.includes('VOLA')) return 'MVOLA'
  if (m === 'ORANGE_MONEY' || m.includes('ORANGE')) return 'ORANGE_MONEY'
  if (m === 'AIRTEL_MONEY' || m.includes('AIRTEL')) return 'AIRTEL_MONEY'
  return null
}

/**
 * Retourne le libellé utilisateur propre pour un mode de paiement
 */
export function getModeDisplayLabel(mode?: string | null): string {
  if (!mode) return '-'
  const op = getMobileMoneyOperator(mode)
  if (op === 'MVOLA') return 'MVola'
  if (op === 'ORANGE_MONEY') return 'Orange Money'
  if (op === 'AIRTEL_MONEY') return 'Airtel Money'

  const upper = mode.trim().toUpperCase()
  if (upper === 'VIREMENT') return 'Virement'
  if (upper === 'CHEQUE') return 'Chèque'
  if (upper === 'ESPECE' || upper === 'ESPECES') return 'Espèce'
  return mode
}

/**
 * Classes Tailwind (Clair et Sombre) pour l'affichage visuel d'un badge opérateur
 */
export function getOperatorBadgeStyles(mode?: string | null): {
  label: string
  containerClass: string
  iconColorClass: string
} {
  const op = getMobileMoneyOperator(mode)
  if (op === 'MVOLA') {
    return {
      label: 'MVola',
      containerClass:
        'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60',
      iconColorClass: 'text-amber-600 dark:text-amber-400',
    }
  }
  if (op === 'ORANGE_MONEY') {
    return {
      label: 'Orange Money',
      containerClass:
        'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700/60',
      iconColorClass: 'text-orange-600 dark:text-orange-400',
    }
  }
  if (op === 'AIRTEL_MONEY') {
    return {
      label: 'Airtel Money',
      containerClass:
        'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
      iconColorClass: 'text-rose-600 dark:text-rose-400',
    }
  }

  // Autres modes génériques
  return {
    label: getModeDisplayLabel(mode),
    containerClass:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    iconColorClass: 'text-slate-500 dark:text-slate-400',
  }
}

/**
 * Détermine si une échéance/paiement a une demande Mobile Money en attente de validation.
 * Détecte les cas où :
 * - Le paiement n'est pas encore validé ('PAYE') ni résilié/annulé
 * - ET le locataire a soumis une demande de paiement (demande_en_cours)
 * - OU le mode de paiement renseigné est Mobile Money (AIRTEL_MONEY, MVOLA, ORANGE_MONEY)
 */
export function isMobileMoneyPending(
  p: Paiement,
  isContratResilieFn?: (p: Paiement) => boolean
): boolean {
  if (!p) return false

  // Un paiement déjà validé, annulé ou résilié ne nécessite plus de validation
  if (p.statut === 'PAYE' || p.statut === 'ANNULE' || p.statut === 'RESILIE') {
    return false
  }

  if (isContratResilieFn && isContratResilieFn(p)) {
    return false
  }

  // 1. Demande de paiement explicite en cours
  if (p.demande_en_cours) {
    const statutDemande = p.demande_en_cours.statut
    if (!statutDemande || statutDemande === 'EN_ATTENTE') {
      return true
    }
  }

  // 2. Mode de paiement Mobile Money renseigné sur l'échéance non encore payée
  const mode = p.demande_en_cours?.moyen_paiement || p.mode_paiement
  if (isMobileMoneyMode(mode)) {
    return true
  }

  return false
}
