import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LoginForm } from './login-form'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}))

describe('LoginForm', () => {
  it('affiche le bouton "Retour à l\'accueil" uniquement en haut et ne le duplique pas en bas de la carte', () => {
    render(<LoginForm />)

    // Vérifier le titre de connexion
    expect(screen.getByRole('heading', { name: /Bon retour !/i })).toBeDefined()

    // Vérifier qu'il y a un lien de retour en haut
    const allHomeLinks = screen.getAllByRole('link', { name: /Retour à l'accueil/i })
    
    // Il y a le logo sur le panneau de gauche (visible sur desktop) et le bouton en haut à gauche
    // Mais aucun lien dupliqué sous "Pas encore de compte ? S'inscrire"
    const signupLink = screen.getByRole('link', { name: /S'inscrire/i })
    expect(signupLink).toBeDefined()

    // Vérifier qu'aucun lien "Retour à l'accueil" n'est présent après le lien d'inscription à l'intérieur du conteneur de la carte
    const card = signupLink.closest('.relative.z-10')
    const linksInCard = card ? card.querySelectorAll('a') : []
    const homeLinksInCard = Array.from(linksInCard).filter((a) =>
      a.textContent?.includes("Retour à l'accueil")
    )
    expect(homeLinksInCard.length).toBe(0)
  })
})
