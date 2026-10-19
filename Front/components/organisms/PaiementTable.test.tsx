import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PaiementTable } from './PaiementTable'
import { Paiement, Contrat } from '@/lib/api'

describe('PaiementTable - Masquage des paiements pour les statuts / contrats résiliés', () => {
  const mockContrats: Contrat[] = [
    {
      id: 10,
      bien: 1,
      bien_titre: 'Appartement Actif',
      locataire: 100,
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
      id: 20,
      bien: 2,
      bien_titre: 'Studio Résilié',
      locataire: 200,
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

  const paiementResilieContrat: Paiement = {
    id: 24,
    contrat: 20,
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
  }

  const paiementAnnuleContratActif: Paiement = {
    id: 15,
    contrat: 10,
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
  }

  const paiementPaye: Paiement = {
    id: 10,
    contrat: 10,
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
  }

  it('ne doit pas afficher sur le tableau un paiement associé à un contrat résilié', () => {
    render(
      <PaiementTable
        paiements={[paiementResilieContrat]}
        contrats={mockContrats}
        loading={false}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    // Le paiement résilié ne doit pas apparaître sur le tableau
    expect(screen.queryByText('#24')).toBeNull()
    expect(screen.queryByText('Studio à loué')).toBeNull()
    expect(screen.getByText('Aucun paiement trouvé.')).toBeDefined()
  })

  it('ne doit pas afficher sur le tableau lorsque contrat_statut est directement "RESILIE"', () => {
    const directPaiement: Paiement = {
      ...paiementResilieContrat,
      id: 25,
      contrat: 999,
      contrat_statut: 'RESILIE',
    }

    render(
      <PaiementTable
        paiements={[directPaiement]}
        contrats={[]}
        loading={false}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    expect(screen.queryByText('#25')).toBeNull()
    expect(screen.getByText('Aucun paiement trouvé.')).toBeDefined()
  })

  it('affiche normalement un paiement annulé lorsque le contrat n’est pas résilié (contrat ACTIF)', () => {
    render(
      <PaiementTable
        paiements={[paiementAnnuleContratActif]}
        contrats={mockContrats}
        loading={false}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    expect(screen.getByText('#15')).toBeDefined()
    expect(screen.getByText('Annulé')).toBeDefined()
  })

  it('affiche normalement les paiements payés sur contrat actif', () => {
    render(
      <PaiementTable
        paiements={[paiementPaye]}
        contrats={mockContrats}
        loading={false}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    expect(screen.getByText('#10')).toBeDefined()
    expect(screen.getByText('Payé')).toBeDefined()
  })

  it('masque les paiements résiliés tout en affichant les autres paiements valides', () => {
    render(
      <PaiementTable
        paiements={[paiementPaye, paiementResilieContrat, paiementAnnuleContratActif]}
        contrats={mockContrats}
        loading={false}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    // Paiements non-résiliés présents
    expect(screen.getByText('#10')).toBeDefined()
    expect(screen.getByText('#15')).toBeDefined()

    // Paiement résilié absent
    expect(screen.queryByText('#24')).toBeNull()
  })
})
