import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PaiementPage from './page'
import * as api from '@/lib/api'

// Mocks
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getPaiements: vi.fn(),
    getContrats: vi.fn(),
    downloadQuittance: vi.fn(),
  }
})

describe('Admin PaiementPage - Masquage et bascule vers l’autre tableau des factures résiliées', () => {
  const mockContrats: api.Contrat[] = [
    {
      id: 1,
      bien: 101,
      bien_titre: 'Appartement Actif',
      locataire: 10,
      type_contrat: 'LOCATION',
      type_paiement_achat: null,
      date_debut: '2026-01-01',
      date_fin: '2026-12-31',
      date_paiement: null,
      loyer: '500000.00',
      depot_garantie: '1000000.00',
      prix: null,
      statut: 'ACTIF',
      document_pdf: null,
      date_creation: '2026-01-01',
    },
    {
      id: 2,
      bien: 102,
      bien_titre: 'Studio à loué',
      locataire: 20,
      type_contrat: 'LOCATION',
      type_paiement_achat: null,
      date_debut: '2025-01-01',
      date_fin: '2025-12-31',
      date_paiement: null,
      loyer: '800000.00',
      depot_garantie: '1600000.00',
      prix: null,
      statut: 'RESILIE',
      document_pdf: null,
      date_creation: '2025-01-01',
    },
  ]

  const mockPaiements: api.Paiement[] = [
    {
      id: 24,
      contrat: 2,
      num_echeance: 5,
      date_echeance: '2026-06-05',
      date_paiement_prevue: '2026-06-05',
      date_paiement: null,
      date_versement_partiel: null,
      montant_attendu: '800000.00',
      montant: '800000.00',
      montant_paye: '0.00',
      montant_restant: '800000.00',
      mode_paiement: null,
      reference: null,
      statut: 'ANNULE',
      est_partiel: false,
      date_creation: '2026-01-01',
      locataire_nom: 'Didier Herlin',
      bien_titre: 'Studio à loué',
      loyer_contrat: '800000.00',
      est_en_retard: false,
      message_mois: 'juin 2026',
      part_proprietaire: null,
      commission_agent: null,
    },
    {
      id: 15,
      contrat: 1,
      num_echeance: 2,
      date_echeance: '2026-03-05',
      date_paiement_prevue: '2026-03-05',
      date_paiement: null,
      date_versement_partiel: null,
      montant_attendu: '500000.00',
      montant: '500000.00',
      montant_paye: '0.00',
      montant_restant: '500000.00',
      mode_paiement: null,
      reference: null,
      statut: 'ANNULE',
      est_partiel: false,
      date_creation: '2026-01-01',
      locataire_nom: 'Alice Martin',
      bien_titre: 'Appartement Actif',
      loyer_contrat: '500000.00',
      est_en_retard: false,
      message_mois: 'mars 2026',
      part_proprietaire: null,
      commission_agent: null,
    },
    {
      id: 10,
      contrat: 1,
      num_echeance: 1,
      date_echeance: '2026-02-05',
      date_paiement_prevue: '2026-02-05',
      date_paiement: '2026-02-04',
      date_versement_partiel: null,
      montant_attendu: '500000.00',
      montant: '500000.00',
      montant_paye: '500000.00',
      montant_restant: '0.00',
      mode_paiement: 'VIREMENT',
      reference: 'VIR-12345',
      statut: 'PAYE',
      est_partiel: false,
      date_creation: '2026-01-01',
      locataire_nom: 'Alice Martin',
      bien_titre: 'Appartement Actif',
      loyer_contrat: '500000.00',
      est_en_retard: false,
      message_mois: 'février 2026',
      part_proprietaire: null,
      commission_agent: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getPaiements).mockResolvedValue(mockPaiements)
    vi.mocked(api.getContrats).mockResolvedValue(mockContrats)
  })

  it('ne doit pas afficher dans le tableau principal les paiements dont le contrat est résilié', async () => {
    render(<PaiementPage />)

    await waitFor(() => {
      expect(screen.getByText('#15')).toBeDefined()
    })

    // Le paiement #24 (Studio à loué, contrat résilié) ne doit pas être affiché
    expect(screen.queryByText('#24')).toBeNull()
    expect(screen.queryByText('Studio à loué')).toBeNull()

    // Les paiements non résiliés (#15 et #10) doivent être affichés
    expect(screen.getByText('#15')).toBeDefined()
    expect(screen.getByText('#10')).toBeDefined()
  })

  it('permet de basculer vers l’autre tableau des factures résiliées via le bouton "Afficher les factures résiliées"', async () => {
    render(<PaiementPage />)

    await waitFor(() => {
      expect(screen.getByText('#15')).toBeDefined()
    })

    // Trouver et cliquer sur le bouton "Afficher les factures résiliées"
    const btnResilie = screen.getByRole('button', { name: /Afficher les factures résiliées/i })
    expect(btnResilie).toBeDefined()
    fireEvent.click(btnResilie)

    // L'autre tableau (Tableau des factures résiliées) doit maintenant être affiché
    expect(screen.getByText('Tableau des factures résiliées')).toBeDefined()
    expect(screen.getByText('#24')).toBeDefined()
    expect(screen.getByText('Studio à loué')).toBeDefined()
    expect(screen.getByText('Résilié')).toBeDefined()

    // Les factures actives (#15 et #10) ne doivent pas être dans ce tableau des résiliées
    expect(screen.queryByText('#15')).toBeNull()
    expect(screen.queryByText('#10')).toBeNull()

    // Cliquer sur le bouton retour aux paiements actifs
    const btnActifs = screen.getByRole('button', { name: /Retour aux paiements actifs/i })
    fireEvent.click(btnActifs)

    // Retour au tableau principal : #15 est réaffiché, #24 est masqué
    expect(screen.getByText('#15')).toBeDefined()
    expect(screen.queryByText('#24')).toBeNull()
  })

  it('permet de filtrer spécifiquement par statut "Annulé" pour les contrats non résiliés', async () => {
    render(<PaiementPage />)

    await waitFor(() => {
      expect(screen.getByText('#15')).toBeDefined()
    })

    const selects = screen.getAllByRole('combobox')
    const statutSelect = selects[0]

    fireEvent.change(statutSelect, { target: { value: 'ANNULE' } })

    // Seul le paiement #15 lié au contrat non résilié doit rester visible
    expect(screen.getByText('#15')).toBeDefined()
    expect(screen.queryByText('#10')).toBeNull()
    expect(screen.queryByText('#24')).toBeNull()
  })

  it('permet de filtrer par statut "Payé" normalement', async () => {
    render(<PaiementPage />)

    await waitFor(() => {
      expect(screen.getByText('#10')).toBeDefined()
    })

    const selects = screen.getAllByRole('combobox')
    const statutSelect = selects[0]

    fireEvent.change(statutSelect, { target: { value: 'PAYE' } })

    expect(screen.getByText('#10')).toBeDefined()
    expect(screen.queryByText('#15')).toBeNull()
    expect(screen.queryByText('#24')).toBeNull()
  })
})
