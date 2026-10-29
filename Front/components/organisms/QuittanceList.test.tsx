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
})
