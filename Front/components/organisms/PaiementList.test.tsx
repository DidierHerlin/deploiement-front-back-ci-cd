import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PaiementList } from './paiements_PaiementList'
import { Paiement, Contrat } from '@/lib/api'

// Mock pour next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/locataire/paiements',
}))

describe('PaiementList - Filtrage des paiements pour les contrats résiliés', () => {
  const mockContrats: Contrat[] = [
    {
      id: 1,
      bien: 10,
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
      id: 2,
      bien: 20,
      bien_titre: 'Villa Résiliée',
      locataire: 100,
      type_contrat: 'LOCATION',
      type_paiement_achat: null,
      date_debut: '2025-01-01',
      date_fin: '2025-12-31',
      date_paiement: null,
      loyer: '700000.00',
      depot_garantie: '1400000.00',
      prix: null,
      statut: 'RESILIE',
      document_pdf: null,
      date_creation: '2025-01-01',
    },
  ]

  const paiementActif: Paiement = {
    id: 11,
    contrat: 1,
    num_echeance: 1,
    date_echeance: '2026-05-05',
    date_paiement_prevue: '2026-05-05',
    date_paiement: null,
    date_versement_partiel: null,
    montant_attendu: '500000.00',
    montant: '500000.00',
    montant_paye: '0.00',
    montant_restant: '500000.00',
    mode_paiement: null,
    reference: null,
    statut: 'EN_ATTENTE',
    est_partiel: false,
    date_creation: '2026-05-01',
    locataire_nom: 'Jean Dupont',
    bien_titre: 'Appartement Actif',
    loyer_contrat: '500000.00',
    est_en_retard: false,
    message_mois: 'mai 2026',
    part_proprietaire: null,
    commission_agent: null,
  }

  const paiementResilie: Paiement = {
    id: 22,
    contrat: 2,
    num_echeance: 1,
    date_echeance: '2025-06-05',
    date_paiement_prevue: '2025-06-05',
    date_paiement: null,
    date_versement_partiel: null,
    montant_attendu: '700000.00',
    montant: '700000.00',
    montant_paye: '0.00',
    montant_restant: '700000.00',
    mode_paiement: null,
    reference: null,
    statut: 'EN_ATTENTE',
    est_partiel: false,
    date_creation: '2025-06-01',
    locataire_nom: 'Jean Dupont',
    bien_titre: 'Villa Résiliée',
    loyer_contrat: '700000.00',
    est_en_retard: false,
    message_mois: 'juin 2025',
    part_proprietaire: null,
    commission_agent: null,
  }

  it('Test 1 : Un paiement associé à un contrat RÉSILIÉ n’apparaît pas dans la liste', () => {
    render(
      <PaiementList
        paiements={[paiementActif, paiementResilie]}
        contrats={mockContrats}
      />
    )

    // Le bien lié au contrat actif doit être présent
    expect(screen.getByText('Appartement Actif')).toBeDefined()

    // Le bien lié au contrat résilié ne doit PAS être affiché
    expect(screen.queryByText('Villa Résiliée')).toBeNull()
  })

  it('Test 2 : Les paiements associés aux contrats non résiliés restent affichés normalement', () => {
    render(
      <PaiementList
        paiements={[paiementActif]}
        contrats={mockContrats}
      />
    )

    // Vérifier l'affichage du titre du bien et des détails
    expect(screen.getByText('Appartement Actif')).toBeDefined()
    expect(screen.getByText('Historique des paiements')).toBeDefined()
    expect(screen.queryByText('Aucun paiement trouvé pour vos contrats avec ce filtre.')).toBeNull()
  })

  it('Test 3 : La page fonctionne correctement lorsqu’il n’y a aucun paiement à afficher', () => {
    // Cas 1 : Aucun paiement dans la liste initiale
    const { unmount } = render(
      <PaiementList
        paiements={[]}
        contrats={mockContrats}
      />
    )
    expect(screen.getByText('Aucun paiement trouvé pour vos contrats avec ce filtre.')).toBeDefined()
    unmount()

    // Cas 2 : Uniquement des paiements de contrats résiliés -> liste vide après filtrage
    render(
      <PaiementList
        paiements={[paiementResilie]}
        contrats={mockContrats}
      />
    )
    expect(screen.getByText('Aucun paiement trouvé pour vos contrats avec ce filtre.')).toBeDefined()
    expect(screen.queryByText('Villa Résiliée')).toBeNull()
  })

  it('Test 4 : Masque également les paiements ayant contrat_statut="RESILIE" directement dans le paiement', () => {
    const paiementDirectResilie: Paiement = {
      ...paiementResilie,
      id: 33,
      bien_titre: 'Maison Directement Résiliée',
      contrat_statut: 'RESILIE',
    }

    render(
      <PaiementList
        paiements={[paiementActif, paiementDirectResilie]}
      />
    )

    expect(screen.getByText('Appartement Actif')).toBeDefined()
    expect(screen.queryByText('Maison Directement Résiliée')).toBeNull()
  })

  it('Test 5 : Masque les paiements ayant contrat imbriqué avec statut="RESILIE"', () => {
    const paiementNestedResilie: Paiement = {
      ...paiementResilie,
      id: 44,
      contrat: { id: 99, statut: 'RESILIE' },
      bien_titre: 'Chalet Contrat Imbriqué Résilié',
    }

    render(
      <PaiementList
        paiements={[paiementActif, paiementNestedResilie]}
      />
    )

    expect(screen.getByText('Appartement Actif')).toBeDefined()
    expect(screen.queryByText('Chalet Contrat Imbriqué Résilié')).toBeNull()
  })
})
