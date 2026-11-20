import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContratForm, { getLocalTodayDateString, normalizeDateInput } from './ContratForm'
import { cleanContratDatePayload } from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    getBiensDisponibles: vi.fn().mockResolvedValue([
      { id: 1, titre: 'Appartement T3', adresse: '123 Rue de Paris', mode_transaction: 'LOCATION', loyer_mensuel: '500' },
      { id: 2, titre: 'Villa Vue Mer', adresse: '456 Av de la Mer', mode_transaction: 'VENTE', prix: '150000' }
    ]),
    getLocataires: vi.fn().mockResolvedValue([
      { id: 10, user: { nom: 'Dupont', prenoms: 'Jean', email: 'jean.dupont@test.com' } }
    ]),
    getBienInfo: vi.fn().mockImplementation(async (id: number) => {
      if (id === 1) {
        return {
          id: 1,
          mode_transaction: 'LOCATION',
          loyer_mensuel: '500',
          prix: null,
          type: 'APPARTEMENT',
          surface: 65,
          adresse: '123 Rue de Paris',
          titre: 'Appartement T3'
        }
      }
      return {
        id: 2,
        mode_transaction: 'VENTE',
        loyer_mensuel: null,
        prix: '150000',
        type: 'VILLA',
        surface: 120,
        adresse: '456 Av de la Mer',
        titre: 'Villa Vue Mer'
      }
    })
  }
})

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (_key: string, def?: string) => def || _key
  })
}))

describe('Date formatting utilities', () => {
  it('getLocalTodayDateString retourne le format YYYY-MM-DD en préservant le jour local', () => {
    // Créer une date locale spécifique (par exemple à 23h30 pour tester l’absence de décalage UTC)
    const localDate = new Date(2026, 10, 20, 23, 30, 0) // 20 Novembre 2026
    const str = getLocalTodayDateString(localDate)
    expect(str).toBe('2026-11-20')
  })

  it('normalizeDateInput gère les cas vides, valides et ISO sans décalage', () => {
    expect(normalizeDateInput('')).toBeNull()
    expect(normalizeDateInput('   ')).toBeNull()
    expect(normalizeDateInput(null)).toBeNull()
    expect(normalizeDateInput(undefined)).toBeNull()

    // Format strict YYYY-MM-DD
    expect(normalizeDateInput('2026-11-20')).toBe('2026-11-20')

    // ISO string avec heure
    expect(normalizeDateInput('2026-11-20T14:30:00.000Z')).toBe('2026-11-20')

    // Chaîne invalide préservée pour validation backend
    expect(normalizeDateInput('invalid-date')).toBe('invalid-date')
  })

  it('cleanContratDatePayload remplace les chaînes vides par null et conserve le format YYYY-MM-DD', () => {
    const payload = {
      bien: 1,
      locataire: 1,
      type_contrat: 'LOCATION' as const,
      date_debut: '',
      date_fin: '2027-11-20'
    }
    const cleaned = cleanContratDatePayload(payload)
    expect(cleaned.date_debut).toBeNull()
    expect(cleaned.date_fin).toBe('2027-11-20')
  })
})

describe('ContratForm component - Création et validation des dates', () => {
  const disponiblesBiens = [
    { id: 1, titre: 'Appartement T3', mode_transaction: 'LOCATION', loyer_mensuel: '500', statut: 'DISPONIBLE' } as any,
    { id: 2, titre: 'Villa Vente', mode_transaction: 'VENTE', prix: '150000', statut: 'DISPONIBLE' } as any
  ]
  const locataires = [
    { id: 10, user: { nom: 'Dupont', prenoms: 'Jean', email: 'jean@test.com' } } as any
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('soumet un contrat LOCATION avec la date sélectionnée au format YYYY-MM-DD', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    const { container } = render(
      <ContratForm 
        disponiblesBiens={disponiblesBiens}
        locataires={locataires}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    )

    const form = container.querySelector('form') as HTMLFormElement
    const selects = screen.getAllByRole('combobox')
    // selects[0] = type_contrat, selects[1] = bien, selects[2] = locataire
    fireEvent.change(selects[1], { target: { value: '1' } })
    fireEvent.change(selects[2], { target: { value: '10' } })

    // Remplir loyer
    const loyerInput = container.querySelector('input[type="number"]') as HTMLInputElement
    if (loyerInput) {
      fireEvent.change(loyerInput, { target: { value: '500' } })
    }

    // Modifier la date de début
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement
    expect(dateInput).not.toBeNull()
    fireEvent.change(dateInput, { target: { value: '2026-11-20' } })

    // Soumettre le formulaire
    fireEvent.submit(form)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    const payloadSent = onSubmit.mock.calls[0][0]
    expect(payloadSent.type_contrat).toBe('LOCATION')
    expect(payloadSent.date_debut).toBe('2026-11-20')
    expect(onClose).toHaveBeenCalled()
  })

  it("soumet un contrat ACHAT avec date d'achat au format YYYY-MM-DD et date_fin à null", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    const { container } = render(
      <ContratForm 
        disponiblesBiens={disponiblesBiens}
        locataires={locataires}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    )

    const form = container.querySelector('form') as HTMLFormElement
    const selects = screen.getAllByRole('combobox')
    // Sélectionner le bien VENTE (id=2)
    fireEvent.change(selects[1], { target: { value: '2' } })
    fireEvent.change(selects[2], { target: { value: '10' } })

    // Attendre l'auto-fill et bascule vers ACHAT
    await waitFor(() => {
      const inputs = container.querySelectorAll('input[type="number"]')
      expect(inputs.length).toBeGreaterThan(0)
    })
    const prixInput = container.querySelector('input[type="number"]') as HTMLInputElement
    expect(prixInput).not.toBeNull()
    fireEvent.change(prixInput, { target: { value: '150000' } })

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement
    expect(dateInput).not.toBeNull()
    fireEvent.change(dateInput, { target: { value: '2026-11-20' } })

    // Soumettre le formulaire
    fireEvent.submit(form)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    const payloadSent = onSubmit.mock.calls[0][0]
    expect(payloadSent.type_contrat).toBe('ACHAT')
    expect(payloadSent.date_debut).toBe('2026-11-20')
    expect(payloadSent.date_fin).toBeNull()
    expect(onClose).toHaveBeenCalled()
  })
})
