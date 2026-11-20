import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un montant en Ariary (ex: "150 000 Ar" ou "0 Ar").
 */
export function formatMontantAr(
  montant: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (montant === null || montant === undefined || montant === '') return '0 Ar'
  const val = typeof montant === 'string' ? parseFloat(montant) : montant
  if (isNaN(val)) return '0 Ar'
  return `${val.toLocaleString('fr-FR', { maximumFractionDigits: 0, ...options })} Ar`
}

/**
 * Formate une date en chaîne lisible au format français (ex: "15/10/2026").
 */
export function formatDateFR(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-'
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return localDate.toLocaleDateString('fr-FR', options)
  }
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('fr-FR', options)
}
