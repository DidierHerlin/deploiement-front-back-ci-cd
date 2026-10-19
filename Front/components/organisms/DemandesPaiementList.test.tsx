import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DemandesPaiementList } from './DemandesPaiementList'
import * as api from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    annulerDemandePaiement: vi.fn(),
  }
})

describe('DemandesPaiementList', () => {
  const mockDemandes: api.DemandePaiement[] = [
    {
      id: 1,
      locataire: 5,
      locataire_nom: 'Jean Dupont',
      facture: 12,
      bien_titre: 'Villa Mahatony',
      mois_echeance_facture: 'Novembre 2026',
      montant: '500000.00',
      date_demande: '2026-10-18T09:30:00Z',
      moyen_paiement: 'MVOLA',
      statut: 'EN_ATTENTE',
      statut_display: 'En attente de validation',
      telephone: '0341122334',
      reference: 'MV123456',
      date_traitement: null,
      motif_refus: '',
      created_at: '2026-10-18T09:30:00Z',
    },
    {
      id: 2,
      locataire: 5,
      locataire_nom: 'Jean Dupont',
      facture: 11,
      bien_titre: 'Studio Ivandry',
      mois_echeance_facture: 'Octobre 2026',
      montant: '250000.00',
      date_demande: '2026-09-18T10:00:00Z',
      moyen_paiement: 'ORANGE_MONEY',
      statut: 'VALIDE',
      statut_display: 'Validée',
      telephone: '0321122334',
      reference: 'OM789012',
      date_traitement: '2026-09-19T14:00:00Z',
      motif_refus: '',
      created_at: '2026-09-18T10:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
  })

  it('affiche un message vide quand aucune demande n existe', () => {
    render(<DemandesPaiementList demandes={[]} />)
    expect(screen.getByText(/Aucune demande de paiement enregistrée/i)).toBeDefined()
  })

  it('affiche les demandes existantes avec leurs informations et badges de statut', () => {
    render(<DemandesPaiementList demandes={mockDemandes} />)

    expect(screen.getByText(/Villa Mahatony/i)).toBeDefined()
    expect(screen.getByText(/Studio Ivandry/i)).toBeDefined()
    expect(screen.getByText(/Novembre 2026/i)).toBeDefined()
    expect(screen.getByText(/Octobre 2026/i)).toBeDefined()
    expect(screen.getByText(/En attente de validation/i)).toBeDefined()
    expect(screen.getByText(/Validée/i)).toBeDefined()
    expect(screen.getByText(/0341122334/i)).toBeDefined()
    expect(screen.getByText(/0321122334/i)).toBeDefined()
  })

  it('permet d annuler une demande en attente', async () => {
    const mockOnCancelled = vi.fn()
    const cancelledDemande: api.DemandePaiement = {
      ...mockDemandes[0],
      statut: 'ANNULE',
      statut_display: 'Annulée',
    }

    vi.mocked(api.annulerDemandePaiement).mockResolvedValueOnce(cancelledDemande)

    render(
      <DemandesPaiementList
        demandes={mockDemandes}
        onDemandeCancelled={mockOnCancelled}
      />
    )

    const annulerBtn = screen.getByRole('button', { name: /Annuler/i })
    fireEvent.click(annulerBtn)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled()
      expect(api.annulerDemandePaiement).toHaveBeenCalledWith(1)
      expect(mockOnCancelled).toHaveBeenCalledWith(cancelledDemande)
    })
  })
})
