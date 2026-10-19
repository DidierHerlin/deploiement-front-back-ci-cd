import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationDemandeModal } from './ValidationDemandeModal'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  validerDemandePaiement: vi.fn(),
  refuserDemandePaiement: vi.fn(),
  validerPaiement: vi.fn(),
  refuserPaiement: vi.fn(),
}))

const fakePaiement: any = {
  id: 42,
  statut: 'EN_ATTENTE',
  montant_attendu: '350000.00',
  montant: '350000.00',
  mode_paiement: 'MVOLA',
  reference: 'REF-MV-999',
  locataire_nom: 'Didier Herlin',
  bien_titre: 'Villa Mahatony',
  message_mois: 'Loyer Novembre 2026',
  demande_en_cours: {
    id: 10,
    statut: 'EN_ATTENTE',
    moyen_paiement: 'MVOLA',
    telephone: '0341234567',
    reference: 'REF-MV-999',
    montant: '350000.00',
    date_demande: '2026-10-18T10:00:00Z',
  },
}

describe('ValidationDemandeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche les informations de la demande Mobile Money à valider', () => {
    render(
      <ValidationDemandeModal
        paiement={fakePaiement}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByText(/Valider le paiement Mobile Money/i)).toBeDefined()
    expect(screen.getByText('Didier Herlin')).toBeDefined()
    expect(screen.getByText('Villa Mahatony')).toBeDefined()
    expect(screen.getByText(/350\s?000\s?Ar/i)).toBeDefined()
    expect(screen.getByText(/0341234567/)).toBeDefined()
    expect(screen.getByText('REF-MV-999')).toBeDefined()
  })

  it('appelle validerDemandePaiement lors de la confirmation de validation', async () => {
    vi.mocked(api.validerDemandePaiement).mockResolvedValueOnce({ id: 10 } as any)
    const onSuccess = vi.fn()
    const onClose = vi.fn()

    render(
      <ValidationDemandeModal
        paiement={fakePaiement}
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )

    const confirmBtn = screen.getByRole('button', { name: /Confirmer la validation/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(api.validerDemandePaiement).toHaveBeenCalledWith(10)
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('permet de basculer en refus et d’envoyer le motif de refus', async () => {
    vi.mocked(api.refuserDemandePaiement).mockResolvedValueOnce({ id: 10 } as any)
    const onSuccess = vi.fn()
    const onClose = vi.fn()

    render(
      <ValidationDemandeModal
        paiement={fakePaiement}
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )

    const switchRefusBtn = screen.getByRole('button', { name: /Refuser la demande/i })
    fireEvent.click(switchRefusBtn)

    expect(screen.getByText(/Motif du refus/i)).toBeDefined()

    const textarea = screen.getByPlaceholderText(/Référence transaction introuvable/i)
    fireEvent.change(textarea, { target: { value: 'Référence introuvable sur le relevé MVola' } })

    const confirmRefusBtn = screen.getByRole('button', { name: /Confirmer le refus/i })
    fireEvent.click(confirmRefusBtn)

    await waitFor(() => {
      expect(api.refuserDemandePaiement).toHaveBeenCalledWith(10, 'Référence introuvable sur le relevé MVola')
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })
})
