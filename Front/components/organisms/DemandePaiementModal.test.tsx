import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DemandePaiementModal } from './DemandePaiementModal'
import * as api from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    creerDemandePaiement: vi.fn(),
  }
})

describe('DemandePaiementModal', () => {
  const mockFacture: api.Paiement = {
    id: 42,
    contrat: 10,
    date_echeance: '2026-11-05',
    statut: 'EN_ATTENTE',
    montant_attendu: '350000.00',
    montant: '350000.00',
    bien_titre: 'Appartement T3 Ambohibao',
    est_eligible_demande: true,
    est_mois_a_venir: true,
  }

  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ne rend rien si isOpen est faux', () => {
    const { container } = render(
      <DemandePaiementModal
        isOpen={false}
        facture={mockFacture}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('affiche exclusivement les opérateurs Mobile Money (aucun virement, chèque, espèces)', () => {
    render(
      <DemandePaiementModal
        isOpen={true}
        facture={mockFacture}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Vérifier la présence des opérateurs Mobile Money autorisés
    expect(screen.getByText('Mvola')).toBeDefined()
    expect(screen.getByText('Orange Money')).toBeDefined()
    expect(screen.getByText('Airtel Money')).toBeDefined()

    // Vérifier les 3 options radio exclusives Mobile Money
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios).toHaveLength(3)
    const radioValues = radios.map(r => r.value)
    expect(radioValues).toEqual(['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY'])

    // Vérifier l'absence de radio ou bouton pour Virement, Espèces, Chèque
    expect(screen.queryByRole('radio', { name: /virement/i })).toBeNull()
    expect(screen.queryByRole('radio', { name: /espèces/i })).toBeNull()
    expect(screen.queryByRole('radio', { name: /chèque/i })).toBeNull()
  })

  it('affiche le montant exact de la facture', () => {
    render(
      <DemandePaiementModal
        isOpen={true}
        facture={mockFacture}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Le montant formaté doit être affiché
    expect(screen.getByText(/350\s?000\s*Ar/i)).toBeDefined()
  })

  it('affiche une erreur de validation si le numéro de téléphone est vide', async () => {
    render(
      <DemandePaiementModal
        isOpen={true}
        facture={mockFacture}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /Envoyer la demande de paiement/i })
    const form = submitBtn.closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/Le numéro de téléphone Mobile Money est requis/i)).toBeDefined()
    })
    expect(api.creerDemandePaiement).not.toHaveBeenCalled()
  })

  it('soumet la demande avec succès et affiche l écran de confirmation', async () => {
    const mockCreatedDemande: api.DemandePaiement = {
      id: 99,
      locataire: 5,
      locataire_nom: 'Jean Dupont',
      facture: 42,
      bien_titre: 'Appartement T3 Ambohibao',
      mois_echeance_facture: 'Novembre 2026',
      montant: '350000.00',
      date_demande: '2026-10-18T10:00:00Z',
      moyen_paiement: 'MVOLA',
      statut: 'EN_ATTENTE',
      statut_display: 'En attente de validation',
      telephone: '0341234567',
      reference: 'REF-TX-12345',
      date_traitement: null,
      motif_refus: '',
      created_at: '2026-10-18T10:00:00Z',
    }

    vi.mocked(api.creerDemandePaiement).mockResolvedValueOnce(mockCreatedDemande)

    render(
      <DemandePaiementModal
        isOpen={true}
        facture={mockFacture}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const phoneInput = screen.getByPlaceholderText(/Ex : 034 00 000 00/i)
    fireEvent.change(phoneInput, { target: { value: '0341234567' } })

    const refInput = screen.getByPlaceholderText(/Ex : MV-12345678/i)
    fireEvent.change(refInput, { target: { value: 'REF-TX-12345' } })

    const submitBtn = screen.getByRole('button', { name: /Envoyer la demande de paiement/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.creerDemandePaiement).toHaveBeenCalledWith({
        facture: 42,
        moyen_paiement: 'MVOLA',
        telephone: '0341234567',
        reference: 'REF-TX-12345',
        montant: 350000,
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/Demande transmise avec succès !/i)).toBeDefined()
      expect(screen.getByText(/#99/i)).toBeDefined()
    })

    expect(mockOnSuccess).toHaveBeenCalledWith(mockCreatedDemande)
  })

  it('permet au locataire de sélectionner Orange Money et enregistre ce choix dans le payload', async () => {
    const mockOrangeDemande: api.DemandePaiement = {
      id: 101,
      locataire: 5,
      locataire_nom: 'Jean Dupont',
      facture: 42,
      bien_titre: 'Appartement T3 Ambohibao',
      mois_echeance_facture: 'Novembre 2026',
      montant: '350000.00',
      date_demande: '2026-10-18T10:00:00Z',
      moyen_paiement: 'ORANGE_MONEY',
      statut: 'EN_ATTENTE',
      statut_display: 'En attente de validation',
      telephone: '0321234567',
      reference: 'OM-TX-9988',
      date_traitement: null,
      motif_refus: '',
      created_at: '2026-10-18T10:00:00Z',
    }

    vi.mocked(api.creerDemandePaiement).mockResolvedValueOnce(mockOrangeDemande)

    render(
      <DemandePaiementModal
        isOpen={true}
        facture={mockFacture}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Sélection de Orange Money
    const orangeRadio = screen.getByDisplayValue('ORANGE_MONEY')
    fireEvent.click(orangeRadio)
    expect((orangeRadio as HTMLInputElement).checked).toBe(true)

    const phoneInput = screen.getByPlaceholderText(/Ex : 034 00 000 00/i)
    fireEvent.change(phoneInput, { target: { value: '0321234567' } })

    const refInput = screen.getByPlaceholderText(/Ex : MV-12345678/i)
    fireEvent.change(refInput, { target: { value: 'OM-TX-9988' } })

    const submitBtn = screen.getByRole('button', { name: /Envoyer la demande de paiement/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.creerDemandePaiement).toHaveBeenCalledWith({
        facture: 42,
        moyen_paiement: 'ORANGE_MONEY',
        telephone: '0321234567',
        reference: 'OM-TX-9988',
        montant: 350000,
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/Demande transmise avec succès !/i)).toBeDefined()
      expect(screen.getByText(/#101/i)).toBeDefined()
    })
  })

  it('permet au locataire de sélectionner Airtel Money et enregistre ce choix dans le payload', async () => {
    const mockAirtelDemande: api.DemandePaiement = {
      id: 102,
      locataire: 5,
      locataire_nom: 'Jean Dupont',
      facture: 42,
      bien_titre: 'Appartement T3 Ambohibao',
      mois_echeance_facture: 'Novembre 2026',
      montant: '350000.00',
      date_demande: '2026-10-18T10:00:00Z',
      moyen_paiement: 'AIRTEL_MONEY',
      statut: 'EN_ATTENTE',
      statut_display: 'En attente de validation',
      telephone: '0331234567',
      reference: 'AM-TX-7766',
      date_traitement: null,
      motif_refus: '',
      created_at: '2026-10-18T10:00:00Z',
    }

    vi.mocked(api.creerDemandePaiement).mockResolvedValueOnce(mockAirtelDemande)

    render(
      <DemandePaiementModal
        isOpen={true}
        facture={mockFacture}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Sélection de Airtel Money
    const airtelRadio = screen.getByDisplayValue('AIRTEL_MONEY')
    fireEvent.click(airtelRadio)
    expect((airtelRadio as HTMLInputElement).checked).toBe(true)

    const phoneInput = screen.getByPlaceholderText(/Ex : 034 00 000 00/i)
    fireEvent.change(phoneInput, { target: { value: '0331234567' } })

    const refInput = screen.getByPlaceholderText(/Ex : MV-12345678/i)
    fireEvent.change(refInput, { target: { value: 'AM-TX-7766' } })

    const submitBtn = screen.getByRole('button', { name: /Envoyer la demande de paiement/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.creerDemandePaiement).toHaveBeenCalledWith({
        facture: 42,
        moyen_paiement: 'AIRTEL_MONEY',
        telephone: '0331234567',
        reference: 'AM-TX-7766',
        montant: 350000,
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/Demande transmise avec succès !/i)).toBeDefined()
      expect(screen.getByText(/#102/i)).toBeDefined()
    })
  })
})
