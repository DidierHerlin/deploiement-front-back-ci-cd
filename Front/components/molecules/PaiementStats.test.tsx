import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PaiementStats } from './paiement_PaiementStats'
import { Paiement } from '@/lib/api'

describe('PaiementStats - Montant total encaissé', () => {
  const user1 = { id: 1, email: 'loc1@test.mg' }
  const user2 = { id: 2, email: 'loc2@test.mg' }
  const user3 = { id: 3, email: 'loc3@test.mg' }

  it('Test 1 : Un utilisateur possède deux factures payées de 100 000 Ar et 150 000 Ar. Le montant total encaissé doit être de 250 000 Ar', () => {
    const paiementsUser1: Paiement[] = [
      {
        id: 101,
        contrat: 1,
        locataire_user_id: user1.id,
        num_echeance: 1,
        date_echeance: '2026-01-05',
        date_paiement_prevue: '2026-01-05',
        date_paiement: '2026-01-05',
        date_versement_partiel: null,
        montant_attendu: '100000.00',
        montant: '100000.00',
        montant_paye: '100000.00',
        montant_restant: '0.00',
        mode_paiement: 'MVOLA',
        reference: 'REF-101',
        statut: 'PAYE',
        est_partiel: false,
        date_creation: '2026-01-01',
        locataire_nom: 'Locataire Un',
        bien_titre: 'Villa Mahatony',
        loyer_contrat: '100000.00',
        est_en_retard: false,
        message_mois: 'janvier 2026',
        part_proprietaire: 90000,
        commission_agent: 10000,
      },
      {
        id: 102,
        contrat: 1,
        locataire_user_id: user1.id,
        num_echeance: 2,
        date_echeance: '2026-02-05',
        date_paiement_prevue: '2026-02-05',
        date_paiement: '2026-02-05',
        date_versement_partiel: null,
        montant_attendu: '150000.00',
        montant: '150000.00',
        montant_paye: '150000.00',
        montant_restant: '0.00',
        mode_paiement: 'ORANGE_MONEY',
        reference: 'REF-102',
        statut: 'PAYE',
        est_partiel: false,
        date_creation: '2026-02-01',
        locataire_nom: 'Locataire Un',
        bien_titre: 'Villa Mahatony',
        loyer_contrat: '150000.00',
        est_en_retard: false,
        message_mois: 'février 2026',
        part_proprietaire: 135000,
        commission_agent: 15000,
      },
    ]

    render(<PaiementStats paiements={paiementsUser1} user={user1} />)

    // Vérifier l'affichage de la carte "Montant total encaissé"
    expect(screen.getByText('Montant total encaissé')).toBeDefined()
    // 250 000 Ar
    expect(screen.getByText(/250[\s\u202f\u00a0]000\s*Ar/)).toBeDefined()
  })

  it('Test 2 : Une facture de 200 000 Ar appartenant à un autre utilisateur ne doit pas être incluse dans le total du premier utilisateur', () => {
    const mixedPaiements: Paiement[] = [
      // Factures de user 1 (100 000 + 150 000 = 250 000 Ar)
      {
        id: 101,
        contrat: 1,
        locataire_user_id: user1.id,
        num_echeance: 1,
        date_echeance: '2026-01-05',
        date_paiement_prevue: '2026-01-05',
        date_paiement: '2026-01-05',
        date_versement_partiel: null,
        montant_attendu: '100000.00',
        montant: '100000.00',
        montant_paye: '100000.00',
        montant_restant: '0.00',
        mode_paiement: 'MVOLA',
        reference: 'REF-101',
        statut: 'PAYE',
        est_partiel: false,
        date_creation: '2026-01-01',
        locataire_nom: 'Locataire Un',
        bien_titre: 'Villa Mahatony',
        loyer_contrat: '100000.00',
        est_en_retard: false,
        message_mois: 'janvier 2026',
        part_proprietaire: 90000,
        commission_agent: 10000,
      },
      {
        id: 102,
        contrat: 1,
        locataire_user_id: user1.id,
        num_echeance: 2,
        date_echeance: '2026-02-05',
        date_paiement_prevue: '2026-02-05',
        date_paiement: '2026-02-05',
        date_versement_partiel: null,
        montant_attendu: '150000.00',
        montant: '150000.00',
        montant_paye: '150000.00',
        montant_restant: '0.00',
        mode_paiement: 'ORANGE_MONEY',
        reference: 'REF-102',
        statut: 'PAYE',
        est_partiel: false,
        date_creation: '2026-02-01',
        locataire_nom: 'Locataire Un',
        bien_titre: 'Villa Mahatony',
        loyer_contrat: '150000.00',
        est_en_retard: false,
        message_mois: 'février 2026',
        part_proprietaire: 135000,
        commission_agent: 15000,
      },
      // Facture de user 2 (200 000 Ar)
      {
        id: 201,
        contrat: 2,
        locataire_user_id: user2.id,
        num_echeance: 1,
        date_echeance: '2026-01-05',
        date_paiement_prevue: '2026-01-05',
        date_paiement: '2026-01-05',
        date_versement_partiel: null,
        montant_attendu: '200000.00',
        montant: '200000.00',
        montant_paye: '200000.00',
        montant_restant: '0.00',
        mode_paiement: 'AIRTEL_MONEY',
        reference: 'REF-201',
        statut: 'PAYE',
        est_partiel: false,
        date_creation: '2026-01-01',
        locataire_nom: 'Locataire Deux',
        bien_titre: 'Appartement Ivandry',
        loyer_contrat: '200000.00',
        est_en_retard: false,
        message_mois: 'janvier 2026',
        part_proprietaire: 180000,
        commission_agent: 20000,
      },
    ]

    // Consultation par User 1
    const { unmount } = render(<PaiementStats paiements={mixedPaiements} user={user1} />)
    expect(screen.getByText(/250[\s\u202f\u00a0]000\s*Ar/)).toBeDefined()
    unmount()

    // Consultation par User 2
    render(<PaiementStats paiements={mixedPaiements} user={user2} />)
    expect(screen.getByText(/200[\s\u202f\u00a0]000\s*Ar/)).toBeDefined()
  })

  it('Test 3 : Une facture de 80 000 Ar en attente de paiement ne doit pas être comptabilisée', () => {
    const paiements: Paiement[] = [
      {
        id: 101,
        contrat: 1,
        locataire_user_id: user1.id,
        num_echeance: 1,
        date_echeance: '2026-01-05',
        date_paiement_prevue: '2026-01-05',
        date_paiement: '2026-01-05',
        date_versement_partiel: null,
        montant_attendu: '100000.00',
        montant: '100000.00',
        montant_paye: '100000.00',
        montant_restant: '0.00',
        mode_paiement: 'MVOLA',
        reference: 'REF-101',
        statut: 'PAYE',
        est_partiel: false,
        date_creation: '2026-01-01',
        locataire_nom: 'Locataire Un',
        bien_titre: 'Villa Mahatony',
        loyer_contrat: '100000.00',
        est_en_retard: false,
        message_mois: 'janvier 2026',
        part_proprietaire: 90000,
        commission_agent: 10000,
      },
      {
        id: 103,
        contrat: 1,
        locataire_user_id: user1.id,
        num_echeance: 2,
        date_echeance: '2026-02-05',
        date_paiement_prevue: '2026-02-05',
        date_paiement: null,
        date_versement_partiel: null,
        montant_attendu: '80000.00',
        montant: '80000.00',
        montant_paye: '0.00',
        montant_restant: '80000.00',
        mode_paiement: null,
        reference: null,
        statut: 'EN_ATTENTE',
        est_partiel: false,
        date_creation: '2026-02-01',
        locataire_nom: 'Locataire Un',
        bien_titre: 'Villa Mahatony',
        loyer_contrat: '80000.00',
        est_en_retard: false,
        message_mois: 'février 2026',
        part_proprietaire: null,
        commission_agent: null,
      },
    ]

    render(<PaiementStats paiements={paiements} user={user1} />)
    // Seul le montant payé (100 000 Ar) doit apparaître comme encaissé
    expect(screen.getByText(/100[\s\u202f\u00a0]000\s*Ar/)).toBeDefined()
  })

  it('Test 4 : Une facture de 120 000 Ar en retard ou partiellement payée ne doit pas être comptabilisée comme payée', () => {
    const paiements: Paiement[] = [
      {
        id: 101,
        contrat: 1,
        locataire_user_id: user1.id,
        num_echeance: 1,
        date_echeance: '2026-01-05',
        date_paiement_prevue: '2026-01-05',
        date_paiement: '2026-01-05',
        date_versement_partiel: null,
        montant_attendu: '100000.00',
        montant: '100000.00',
        montant_paye: '100000.00',
        montant_restant: '0.00',
        mode_paiement: 'MVOLA',
        reference: 'REF-101',
        statut: 'PAYE',
        est_partiel: false,
        date_creation: '2026-01-01',
        locataire_nom: 'Locataire Un',
        bien_titre: 'Villa Mahatony',
        loyer_contrat: '100000.00',
        est_en_retard: false,
        message_mois: 'janvier 2026',
        part_proprietaire: 90000,
        commission_agent: 10000,
      },
      // Facture en retard (120 000 Ar)
      {
        id: 104,
        contrat: 1,
        locataire_user_id: user1.id,
        num_echeance: 2,
        date_echeance: '2025-12-05',
        date_paiement_prevue: '2025-12-05',
        date_paiement: null,
        date_versement_partiel: null,
        montant_attendu: '120000.00',
        montant: '120000.00',
        montant_paye: '0.00',
        montant_restant: '120000.00',
        mode_paiement: null,
        reference: null,
        statut: 'EN_RETARD',
        est_partiel: false,
        date_creation: '2025-12-01',
        locataire_nom: 'Locataire Un',
        bien_titre: 'Villa Mahatony',
        loyer_contrat: '120000.00',
        est_en_retard: true,
        message_mois: 'décembre 2025',
        part_proprietaire: null,
        commission_agent: null,
      },
      // Facture partiellement payée (120 000 Ar attendus, 50 000 Ar payés)
      {
        id: 105,
        contrat: 1,
        locataire_user_id: user1.id,
        num_echeance: 3,
        date_echeance: '2026-03-05',
        date_paiement_prevue: '2026-03-05',
        date_paiement: null,
        date_versement_partiel: '2026-03-05',
        montant_attendu: '120000.00',
        montant: '120000.00',
        montant_paye: '50000.00',
        montant_restant: '70000.00',
        mode_paiement: 'MVOLA',
        reference: 'REF-PARTIEL',
        statut: 'PARTIEL',
        est_partiel: true,
        date_creation: '2026-03-01',
        locataire_nom: 'Locataire Un',
        bien_titre: 'Villa Mahatony',
        loyer_contrat: '120000.00',
        est_en_retard: false,
        message_mois: 'mars 2026',
        part_proprietaire: null,
        commission_agent: null,
      },
    ]

    render(<PaiementStats paiements={paiements} user={user1} />)
    // Seule la facture de 100 000 Ar doit être comptabilisée
    expect(screen.getByText(/100[\s\u202f\u00a0]000\s*Ar/)).toBeDefined()
  })

  it('Test 5 : Si l’utilisateur connecté n’a aucune facture payée, le montant total encaissé doit être de 0 Ar', () => {
    const paiements: Paiement[] = [
      {
        id: 301,
        contrat: 3,
        locataire_user_id: user3.id,
        num_echeance: 1,
        date_echeance: '2026-01-05',
        date_paiement_prevue: '2026-01-05',
        date_paiement: null,
        date_versement_partiel: null,
        montant_attendu: '50000.00',
        montant: '50000.00',
        montant_paye: '0.00',
        montant_restant: '50000.00',
        mode_paiement: null,
        reference: null,
        statut: 'EN_ATTENTE',
        est_partiel: false,
        date_creation: '2026-01-01',
        locataire_nom: 'Locataire Trois',
        bien_titre: 'Studio Ankorondrano',
        loyer_contrat: '50000.00',
        est_en_retard: false,
        message_mois: 'janvier 2026',
        part_proprietaire: null,
        commission_agent: null,
      },
    ]

    render(<PaiementStats paiements={paiements} user={user3} />)
    expect(screen.getByText('0 Ar')).toBeDefined()
  })

  it('Test 6 : Affiche fidèlement la valeur retournée par le backend si les stats sont fournies', () => {
    const backendStats = {
      total: 2,
      count_paye: 2,
      count_attente: 0,
      count_retard: 0,
      total_encaisse: 250000,
      montant_restant: 0,
    }

    render(<PaiementStats paiements={[]} user={user1} stats={backendStats} />)
    expect(screen.getByText(/250[\s\u202f\u00a0]000\s*Ar/)).toBeDefined()
  })
})
