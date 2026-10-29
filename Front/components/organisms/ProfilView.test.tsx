import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProfilView from './ProfilView'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  getProfil: vi.fn(),
  updateProfil: vi.fn(),
  resolveMediaUrl: vi.fn((url) => url),
}))

const mockUser: api.UserProfil = {
  id: 1,
  nom: 'Herlin',
  prenoms: 'Didier',
  email: 'didier.herlin@example.com',
  telephone: '0340000000',
  role: 'LOCATAIRE',
  photo_profil: null,
  date_creation: '2026-01-15T08:00:00Z',
}

describe('ProfilView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getProfil).mockResolvedValue(mockUser)
  })

  it('affiche la carte de profil avec les classes du Dark Mode et les champs stylisés', async () => {
    render(<ProfilView />)

    // Titre de section
    expect(await screen.findByText(/Informations Personnelles/i)).toBeDefined()

    // Vérifie la présence des champs pré-remplis
    const prenomInput = screen.getByDisplayValue('Didier')
    const nomInput = screen.getByDisplayValue('Herlin')
    const emailInput = screen.getByDisplayValue('didier.herlin@example.com')
    const telInput = screen.getByDisplayValue('0340000000')

    expect(prenomInput).toBeDefined()
    expect(nomInput).toBeDefined()
    expect(emailInput).toBeDefined()
    expect(telInput).toBeDefined()

    // Vérifie que les classes Dark Mode demandées sont bien appliquées sur les inputs
    expect(prenomInput.className).toContain('dark:bg-slate-900')
    expect(prenomInput.className).toContain('dark:border-slate-800')
    expect(prenomInput.className).toContain('dark:text-white')

    // Vérifie le bouton Enregistrer les modifications
    const submitBtn = screen.getByRole('button', { name: /Enregistrer les modifications/i })
    expect(submitBtn.className).toContain('bg-blue-600')
    expect(submitBtn.className).toContain('text-white')
  })
})
