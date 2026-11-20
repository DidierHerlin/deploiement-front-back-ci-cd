import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PaiementDetails } from './PaiementDetails'
import { Paiement } from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    downloadQuittance: vi.fn(),
  }
})

describe('PaiementDetails - Rubrique Finances et calculs des commissions', () => {
  it('affiche la commission à 5 % (3 125 000 Ar) et la part vendeur pour la première tranche de 62 500 000 Ar', () => {
    const mockPaiementTranche1: Paiement = {
      id: 101,
      contrat: 20,
      num_echeance: 1,
      date_echeance: '2026-11-01',
      date_paiement: '2026-11-01',
      montant: '62500000.00',
      montant_paye: '62500000.00',
      montant_attendu: '62500000.00',
      montant_restant: '0.00',
      statut: 'PAYE',
      type_contrat: 'ACHAT',
      type_paiement_achat: 'PARTIEL',
      commission_agent: null,
      part_proprietaire: null,
      bien_titre: 'Villa Océan',
      locataire_nom: 'Client Acheteur',
      loyer_contrat: '',
      est_partiel: false,
      est_en_retard: false,
      date_creation: '2026-11-01',
      mode_paiement: 'VIREMENT',
      reference: 'VIR-001',
      date_paiement_prevue: null,
      date_versement_partiel: null,
      message_mois: '',
    }

    render(<PaiementDetails paiement={mockPaiementTranche1} onClose={vi.fn()} />)

    // Libellés attendus
    expect(screen.getByText('Commission agence (5 %)')).toBeDefined()
    expect(screen.getByText('Part du vendeur')).toBeDefined()

    // Montants attendus : 3 125 000 Ar et 59 375 000 Ar
    expect(screen.getByText(/3[\s\u202f]125[\s\u202f]000\s*Ar/i)).toBeDefined()
    expect(screen.getByText(/59[\s\u202f]375[\s\u202f]000\s*Ar/i)).toBeDefined()
  })

  it('affiche la commission à 1 % (125 000 Ar) et la part vendeur pour une tranche suivante de 12 500 000 Ar', () => {
    const mockPaiementTranche2: Paiement = {
      id: 102,
      contrat: 20,
      num_echeance: 2,
      date_echeance: '2026-12-01',
      date_paiement: '2026-12-01',
      montant: '12500000.00',
      montant_paye: '12500000.00',
      montant_attendu: '12500000.00',
      montant_restant: '0.00',
      statut: 'PAYE',
      type_contrat: 'ACHAT',
      type_paiement_achat: 'PARTIEL',
      commission_agent: null,
      part_proprietaire: null,
      bien_titre: 'Villa Océan',
      locataire_nom: 'Client Acheteur',
      loyer_contrat: '',
      est_partiel: false,
      est_en_retard: false,
      date_creation: '2026-11-01',
      mode_paiement: 'VIREMENT',
      reference: 'VIR-002',
      date_paiement_prevue: null,
      date_versement_partiel: null,
      message_mois: '',
    }

    render(<PaiementDetails paiement={mockPaiementTranche2} onClose={vi.fn()} />)

    // Libellés attendus
    expect(screen.getByText('Commission agence (1 %)')).toBeDefined()
    expect(screen.getByText('Part du vendeur')).toBeDefined()

    // Montants attendus : 125 000 Ar et 12 375 000 Ar
    expect(screen.getByText(/125[\s\u202f]000\s*Ar/i)).toBeDefined()
    expect(screen.getByText(/12[\s\u202f]375[\s\u202f]000\s*Ar/i)).toBeDefined()
  })

  it('préserve le traitement actuel pour le paiement de location n° 56 (40 000 Ar de commission et 1 160 000 Ar part propriétaire)', () => {
    const mockPaiementLocation56: Paiement = {
      id: 56,
      contrat: 7,
      num_echeance: 1,
      date_echeance: '2026-11-01',
      date_paiement: '2026-11-01',
      montant: '1200000.00',
      montant_paye: '1200000.00',
      montant_attendu: '1200000.00',
      montant_restant: '0.00',
      statut: 'PAYE',
      type_contrat: 'LOCATION',
      type_paiement_achat: null,
      commission_agent: 40000.0,
      part_proprietaire: 1160000.0,
      bien_titre: 'Appartement T2',
      locataire_nom: 'Locataire Test',
      loyer_contrat: '400000.00',
      est_partiel: false,
      est_en_retard: false,
      date_creation: '2026-11-01',
      mode_paiement: 'VIREMENT',
      reference: 'VIR-056',
      date_paiement_prevue: null,
      date_versement_partiel: null,
      message_mois: 'Novembre 2026',
    }

    render(<PaiementDetails paiement={mockPaiementLocation56} onClose={vi.fn()} />)

    // Libellés attendus pour une location
    expect(screen.getByText('Commission Agence')).toBeDefined()
    expect(screen.getByText('Part Propriétaire')).toBeDefined()

    // Montants attendus calculés par le backend
    expect(screen.getByText(/40[\s\u202f]000\s*Ar/i)).toBeDefined()
    expect(screen.getByText(/1[\s\u202f]160[\s\u202f]000\s*Ar/i)).toBeDefined()
  })

  it('préserve le traitement actuel pour un achat payé en une seule fois (comptant)', () => {
    const mockPaiementComptant: Paiement = {
      id: 55,
      contrat: 6,
      num_echeance: 1,
      date_echeance: '2026-11-01',
      date_paiement: '2026-11-01',
      montant: '80000000.00',
      montant_paye: '80000000.00',
      montant_attendu: '80000000.00',
      montant_restant: '0.00',
      statut: 'PAYE',
      type_contrat: 'ACHAT',
      type_paiement_achat: 'TOTALITE',
      commission_agent: null,
      part_proprietaire: null,
      bien_titre: 'Trano amidy',
      locataire_nom: 'Acheteur Comptant',
      loyer_contrat: '',
      est_partiel: false,
      est_en_retard: false,
      date_creation: '2026-11-01',
      mode_paiement: 'CHEQUE',
      reference: 'CHQ-055',
      date_paiement_prevue: null,
      date_versement_partiel: null,
      message_mois: '',
    }

    render(<PaiementDetails paiement={mockPaiementComptant} onClose={vi.fn()} />)

    expect(screen.getByText('Commission Agence')).toBeDefined()
    expect(screen.getByText('Part Propriétaire')).toBeDefined()
  })
})
