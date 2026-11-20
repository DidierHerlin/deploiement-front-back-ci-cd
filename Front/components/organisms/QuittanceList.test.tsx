import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuittanceList } from './QuittanceList'
import { Paiement, Contrat } from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    fetchBlob: vi.fn().mockResolvedValue(new Blob(['mock-pdf'], { type: 'application/pdf' })),
  }
})

describe('QuittanceList', () => {
  const mockContrats: Contrat[] = [
    {
      id: 10,
      bien: 1,
      bien_titre: 'Appartement T3 Ankorondrano',
      locataire: 5,
      locataire_nom: 'Ma Annah',
      date_debut: '2026-01-01',
      date_fin: '2026-12-31',
      loyer: '450000.00',
      depot_garantie: '450000.00',
      statut: 'ACTIF',
      actif: true,
      periodicite: 'MENSUEL',
      conditions_particulieres: '',
      contrat_signe: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ]

  const mockPaiements: Paiement[] = [
    {
      id: 1,
      contrat: 10,
      date_echeance: '2026-10-05',
      date_paiement: '2026-10-04',
      montant: '450000.00',
      montant_paye: '450000.00',
      statut: 'VALIDE',
      type_paiement: 'MOBILE_MONEY',
      quittance: null,
      recu: null,
      retard_jours: 0,
    },
    {
      id: 2,
      contrat: 10,
      date_echeance: '2026-11-05',
      date_paiement: null,
      montant: '450000.00',
      montant_paye: '0.00',
      statut: 'EN_ATTENTE',
      type_paiement: null,
      quittance: null,
      recu: null,
      retard_jours: 0,
    },
  ]

  it('affiche uniquement les paiements validés/payés avec les styles Dark Mode adéquats', () => {
    render(
      <QuittanceList 
        paiements={mockPaiements} 
        contrats={mockContrats} 
        loading={false} 
      />
    )

    // Only 1 quittance (VALIDE), not the EN_ATTENTE
    expect(screen.getByText(/N° 0001/i)).toBeDefined()
    expect(screen.queryByText(/N° 0002/i)).toBeNull()

    // Carte conteneur
    const badge = screen.getByText(/N° 0001/i)
    const card = badge.closest('.bg-white') as HTMLElement
    expect(card).toBeDefined()
    expect(card.className).toContain('dark:bg-slate-900')
    expect(card.className).toContain('dark:border-slate-800')
    expect(card.className).toContain('rounded-2xl')
    expect(card.className).toContain('shadow-lg')

    // Badge N° 0001
    expect(badge.className).toContain('dark:bg-emerald-500/15')
    expect(badge.className).toContain('dark:text-emerald-400')
    expect(badge.className).toContain('dark:border-emerald-500/30')

    // Libellés et valeurs
    const typeLabel = screen.getByText(/Type de transaction/i)
    expect(typeLabel.className).toContain('dark:text-slate-400')
    const typeValeurs = screen.getAllByText('Location')
    expect(typeValeurs.length).toBeGreaterThanOrEqual(1)

    const bienLabel = screen.getByText(/Bien concerné/i)
    expect(bienLabel.className).toContain('dark:text-slate-400')
    const bienValeur = screen.getByText('Appartement T3 Ankorondrano')
    expect(bienValeur.className).toContain('dark:text-slate-200')

    const montantLabel = screen.getByText(/Montant réglé/i)
    expect(montantLabel.className).toContain('dark:text-slate-400')
    const montantValeur = screen.getByText('450 000 Ar')
    expect(montantValeur.className).toContain('dark:text-slate-200')

    const dateLabel = screen.getByText(/Date de règlement/i)
    expect(dateLabel.className).toContain('dark:text-slate-400')

    // Bouton de téléchargement PDF
    const downloadBtn = screen.getByRole('button', { name: /Télécharger le PDF/i })
    expect(downloadBtn.className).toContain('dark:bg-slate-800')
    expect(downloadBtn.className).toContain('dark:text-slate-200')
    expect(downloadBtn.className).toContain('dark:border-slate-700')
  })

  it('affiche un état vide quand aucune quittance n est disponible', () => {
    render(
      <QuittanceList 
        paiements={[]} 
        contrats={[]} 
        loading={false} 
      />
    )

    expect(screen.getByText(/Aucune quittance disponible/i)).toBeDefined()
  })

  it('affiche correctement le montant réglé et le titre pour un achat comptant (n° 0055) et un achat échelonné (n° 0082 et n° 0049)', () => {
    const mockAchatContrats: Contrat[] = [
      {
        id: 6,
        bien: 10,
        bien_titre: 'Trano amidy',
        locataire: 3,
        locataire_nom: 'Acheteur Comptant',
        date_debut: '2026-11-01',
        date_fin: null,
        loyer: null,
        prix: '80000000.00',
        statut: 'VENDU',
        actif: false,
        type_contrat: 'ACHAT',
        type_paiement_achat: 'TOTALITE',
        depot_garantie: null,
        periodicite: 'MENSUEL',
        conditions_particulieres: '',
        contrat_signe: null,
        created_at: '2026-11-01',
        updated_at: '2026-11-01',
      },
      {
        id: 12,
        bien: 15,
        bien_titre: 'BELLE MAISON',
        locataire: 4,
        locataire_nom: 'Acheteur Échelonné',
        date_debut: '2026-11-01',
        date_fin: null,
        loyer: null,
        prix: '25000000.00',
        statut: 'ACTIF',
        actif: true,
        type_contrat: 'ACHAT',
        type_paiement_achat: 'PARTIEL',
        depot_garantie: null,
        periodicite: 'MENSUEL',
        conditions_particulieres: '',
        contrat_signe: null,
        created_at: '2026-11-01',
        updated_at: '2026-11-01',
      },
      {
        id: 5,
        bien: 6,
        bien_titre: 'Térrain à vendre',
        locataire: 2,
        locataire_nom: 'Acheteur Terrain',
        date_debut: '2026-10-01',
        date_fin: null,
        loyer: null,
        prix: '45000000.00',
        statut: 'ACTIF',
        actif: true,
        type_contrat: 'ACHAT',
        type_paiement_achat: 'PARTIEL',
        depot_garantie: null,
        periodicite: 'MENSUEL',
        conditions_particulieres: '',
        contrat_signe: null,
        created_at: '2026-10-01',
        updated_at: '2026-10-01',
      },
    ]

    const mockAchatPaiements: Paiement[] = [
      {
        id: 55,
        contrat: 6,
        num_echeance: 1,
        date_echeance: '2026-11-05',
        date_paiement: '2026-11-05',
        montant: '80000000.00',
        montant_paye: '80000000.00',
        statut: 'PAYE',
        type_paiement: 'VIREMENT',
        quittance: null,
        recu: null,
        retard_jours: 0,
      },
      {
        id: 82,
        contrat: 12,
        num_echeance: 1,
        date_echeance: '2026-11-05',
        date_paiement: '2026-11-05',
        montant: '12500000.00',
        montant_paye: '12500000.00',
        statut: 'PAYE',
        type_paiement: 'MOBILE_MONEY',
        quittance: null,
        recu: null,
        retard_jours: 0,
      },
      {
        id: 49,
        contrat: 5,
        num_echeance: 1,
        date_echeance: '2026-10-05',
        date_paiement: '2026-10-05',
        montant: '22500000.00',
        montant_paye: '22500000.00',
        statut: 'PAYE',
        type_paiement: 'MOBILE_MONEY',
        quittance: null,
        recu: null,
        retard_jours: 0,
      },
    ]

    render(
      <QuittanceList 
        paiements={mockAchatPaiements} 
        contrats={mockAchatContrats} 
        loading={false} 
        currentUser={{ id: 3, role: 'LOCATAIRE' }}
      />
    )

    // Titre de la page dynamique
    expect(screen.getByText('Mes quittances et reçus')).toBeDefined()

    // Vérification du reçu n° 0055 (Achat comptant : Trano amidy)
    expect(screen.getByText('Reçu d’achat · N° 0055')).toBeDefined()
    expect(screen.getByText('Trano amidy')).toBeDefined()
    expect(screen.getByText(/80[\s\u202f]000[\s\u202f]000\s*Ar/i)).toBeDefined()

    // Vérification du reçu n° 0082 (Achat échelonné tranche 1 : BELLE MAISON)
    expect(screen.getByText('Reçu d’achat (Tranche 1/6) · N° 0082')).toBeDefined()
    expect(screen.getByText('BELLE MAISON')).toBeDefined()
    expect(screen.getByText(/12[\s\u202f]500[\s\u202f]000\s*Ar/i)).toBeDefined()

    // Vérification du reçu n° 0049 (Achat échelonné tranche 1 : Térrain à vendre)
    expect(screen.getByText('Reçu d’achat (Tranche 1/6) · N° 0049')).toBeDefined()
    expect(screen.getByText('Térrain à vendre')).toBeDefined()
    expect(screen.getByText(/22[\s\u202f]500[\s\u202f]000\s*Ar/i)).toBeDefined()

    // Vérification de la présence des badges et libellés "Achat"
    const badgesAchat = screen.getAllByText('Achat')
    expect(badgesAchat.length).toBeGreaterThanOrEqual(3)
  })

  it('affiche le type Vente et les libellés adaptés dans l espace du vendeur', () => {
    const mockVenteContrat: Contrat[] = [
      {
        id: 6,
        bien: 10,
        bien_titre: 'Trano amidy',
        locataire: 3,
        locataire_user_id: 3,
        proprietaire_user_id: 4,
        locataire_nom: 'Acheteur',
        date_debut: '2026-11-01',
        date_fin: null,
        loyer: null,
        prix: '80000000.00',
        statut: 'VENDU',
        actif: false,
        type_contrat: 'ACHAT',
        type_paiement_achat: 'TOTALITE',
        depot_garantie: null,
        periodicite: 'MENSUEL',
        conditions_particulieres: '',
        contrat_signe: null,
        created_at: '2026-11-01',
        updated_at: '2026-11-01',
      },
      {
        id: 12,
        bien: 15,
        bien_titre: 'BELLE MAISON',
        locataire: 3,
        locataire_user_id: 3,
        proprietaire_user_id: 4,
        locataire_nom: 'Acheteur',
        date_debut: '2026-11-01',
        date_fin: null,
        loyer: null,
        prix: '25000000.00',
        statut: 'ACTIF',
        actif: true,
        type_contrat: 'ACHAT',
        type_paiement_achat: 'PARTIEL',
        depot_garantie: null,
        periodicite: 'MENSUEL',
        conditions_particulieres: '',
        contrat_signe: null,
        created_at: '2026-11-01',
        updated_at: '2026-11-01',
      },
    ]

    const mockVentePaiements: Paiement[] = [
      {
        id: 55,
        contrat: 6,
        num_echeance: 1,
        date_echeance: '2026-11-05',
        date_paiement: '2026-11-05',
        montant: '80000000.00',
        montant_paye: '80000000.00',
        statut: 'PAYE',
        type_paiement: 'VIREMENT',
        quittance: null,
        recu: null,
        retard_jours: 0,
        locataire_user_id: 3,
        proprietaire_user_id: 4,
      },
      {
        id: 82,
        contrat: 12,
        num_echeance: 1,
        date_echeance: '2026-11-05',
        date_paiement: '2026-11-05',
        montant: '12500000.00',
        montant_paye: '12500000.00',
        statut: 'PAYE',
        type_paiement: 'MOBILE_MONEY',
        quittance: null,
        recu: null,
        retard_jours: 0,
        locataire_user_id: 3,
        proprietaire_user_id: 4,
      },
    ]

    render(
      <QuittanceList 
        paiements={mockVentePaiements} 
        contrats={mockVenteContrat} 
        loading={false} 
        currentUser={{ id: 4, role: 'PROPRIETAIRE' }}
      />
    )

    // Vérification de l'affichage dans l'espace vendeur
    expect(screen.getByText('Reçu de vente · N° 0055')).toBeDefined()
    expect(screen.getByText('Reçu de vente (Tranche 1/6) · N° 0082')).toBeDefined()

    // Badges et libellés "Vente"
    const badgesVente = screen.getAllByText('Vente')
    expect(badgesVente.length).toBeGreaterThanOrEqual(2)
  })
})
