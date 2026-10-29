import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ParametresPageView } from './ParametresPageView'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  getProfil: vi.fn(),
  updateProfil: vi.fn(),
  resolveMediaUrl: vi.fn((url) => url),
}))

const setThemeMock = vi.fn()
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: setThemeMock,
    systemTheme: 'dark',
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUser: api.UserProfil = {
  id: 1,
  nom: 'Herlin',
  prenoms: 'Didier',
  email: 'didier.herlin@example.com',
  telephone: '0340000000',
  role: 'LOCATAIRE',
  photo_profil: null,
}

describe('ParametresPageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getProfil).mockResolvedValue(mockUser)
  })

  it('affiche les onglets de configuration et le profil par défaut', async () => {
    render(<ParametresPageView role="LOCATAIRE" />)

    expect(await screen.findByText(/Paramètres du compte/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Profil & Sécurité/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Préférences d’alertes/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Apparence & Langue/i })).toBeDefined()

    // Vérifie que les données du profil sont chargées
    expect(await screen.findByDisplayValue('Didier')).toBeDefined()
    expect(screen.getByDisplayValue('Herlin')).toBeDefined()
  })

  it('permet de basculer vers les préférences de notifications et modifier un toggle', async () => {
    render(<ParametresPageView role="LOCATAIRE" />)

    const notifTab = screen.getByRole('button', { name: /Préférences d’alertes/i })
    fireEvent.click(notifTab)

    expect(await screen.findByText(/Notifications par Email/i)).toBeDefined()
    expect(screen.getByText(/Avis d’échéances et rappels de loyer/i)).toBeDefined()
    expect(screen.getByText(/Alertes SMS & Mobile Money/i)).toBeDefined()
  })

  it('permet de basculer vers Apparence & Langue et changer de thème', async () => {
    render(<ParametresPageView role="LOCATAIRE" />)

    const appearanceTab = screen.getByRole('button', { name: /Apparence & Langue/i })
    fireEvent.click(appearanceTab)

    expect(await screen.findByText(/Mode d’affichage \(Thème\)/i)).toBeDefined()
    expect(screen.getByText(/Langue de l’interface/i)).toBeDefined()

    // Clique sur le thème Clair
    const lightThemeCard = screen.getByText(/Clair \(Normal\)/i)
    fireEvent.click(lightThemeCard)

    expect(setThemeMock).toHaveBeenCalledWith('light')
  })
})
