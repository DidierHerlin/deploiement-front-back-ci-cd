import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaiementForm } from './PaiementForm'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  validerPaiement: vi.fn(),
  updatePaiement: vi.fn(),
}))

const fakePaiement: any = {
  id: 101,
  statut: 'EN_ATTENTE',
  montant_attendu: '1200000.00',
  montant: '1200000.00',
  mode_paiement: 'MVOLA',
  reference: 'REF-MV-1234',
  locataire_nom: 'Jean Dupont',
  bien_titre: 'Appartement T3 Centre',
  est_partiel: false,
}

describe('PaiementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rend le modal avec l overlay Tailwind centré et le dark mode sur la boîte MONTANT', () => {
    const { container } = render(
      <PaiementForm
        paiement={fakePaiement}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    // Vérifier l'overlay centré
    const backdrop = container.firstElementChild as HTMLElement
    expect(backdrop.className).toContain('fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4')

    // Vérifier le dialog
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl')

    // Vérifier l'encadré MONTANT
    const montantLabel = screen.getByText('MONTANT')
    expect(montantLabel.className).toContain('text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase')
    
    const montantContainer = montantLabel.closest('div')
    expect(montantContainer?.className).toContain('bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4')

    const montantValue = screen.getByText(/1\s?200\s?000\s?Ar/)
    expect(montantValue.className).toContain('text-slate-900 dark:text-white text-xl font-bold')
  })

  it('applique les classes de mode sombre sur les selects et les balises option', () => {
    const { container } = render(
      <PaiementForm
        paiement={fakePaiement}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    const selects = container.querySelectorAll('select')
    expect(selects.length).toBeGreaterThanOrEqual(2)

    selects.forEach((select) => {
      expect(select.className).toContain('bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white')
      
      const options = select.querySelectorAll('option')
      options.forEach((opt) => {
        expect(opt.className).toContain('bg-white dark:bg-slate-900 text-slate-900 dark:text-white')
      })
    })
  })

  it('affiche et applique les classes dark mode sur l input de référence pour Mobile Money', () => {
    render(
      <PaiementForm
        paiement={fakePaiement}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    const refInput = screen.getByDisplayValue('REF-MV-1234')
    expect(refInput.className).toContain('bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white')
  })

  it('soumet la validation du paiement avec succès', async () => {
    vi.mocked(api.validerPaiement).mockResolvedValueOnce({ id: 101, statut: 'PAYE' } as any)
    const onSuccess = vi.fn()
    const onClose = vi.fn()

    render(
      <PaiementForm
        paiement={fakePaiement}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /Valider le paiement/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.validerPaiement).toHaveBeenCalledWith(101, 'MVOLA', 'REF-MV-1234')
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
