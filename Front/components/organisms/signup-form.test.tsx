import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SignupForm } from './signup-form'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('SignupForm Multi-Step', () => {
  it('affiche uniquement Nom et Prénom(s) à l’étape 1 et bloque le passage si vide', () => {
    render(<SignupForm />)

    // Indicateur d'étape
    expect(screen.getByText(/Étape 1 sur 3/i)).toBeDefined()
    expect(screen.getByLabelText(/^Nom$/i)).toBeDefined()
    expect(screen.getByLabelText(/Prénom\(s\)/i)).toBeDefined()

    // Email et Mot de passe ne doivent pas être visibles à l'étape 1
    expect(screen.queryByLabelText(/^Email$/i)).toBeNull()
    expect(screen.queryByLabelText(/Mot de passe/i)).toBeNull()

    // Cliquer sur Suivant sans rien remplir
    const nextBtn = screen.getByRole('button', { name: /Suivant/i })
    fireEvent.click(nextBtn)

    // Doit rester à l'étape 1 et afficher l'erreur
    expect(screen.getByText(/Le nom est obligatoire/i)).toBeDefined()
  })

  it('passe à l’étape 2 après saisie du nom et prénom', () => {
    render(<SignupForm />)

    const nomInput = screen.getByLabelText(/^Nom$/i)
    const prenomsInput = screen.getByLabelText(/Prénom\(s\)/i)

    fireEvent.change(nomInput, { target: { value: 'Rakoto' } })
    fireEvent.change(prenomsInput, { target: { value: 'Jean' } })

    const nextBtn = screen.getByRole('button', { name: /Suivant/i })
    fireEvent.click(nextBtn)

    // Étape 2 atteinte
    expect(screen.getByText(/Étape 2 sur 3/i)).toBeDefined()
    expect(screen.getByLabelText(/^Email$/i)).toBeDefined()
    expect(screen.getByLabelText(/Téléphone/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Précédent/i })).toBeDefined()
  })

  it('permet de revenir à l’étape 1 depuis l’étape 2 avec le bouton Précédent', () => {
    render(<SignupForm />)

    fireEvent.change(screen.getByLabelText(/^Nom$/i), { target: { value: 'Rakoto' } })
    fireEvent.change(screen.getByLabelText(/Prénom\(s\)/i), { target: { value: 'Jean' } })
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

    expect(screen.getByText(/Étape 2 sur 3/i)).toBeDefined()

    // Clic sur Précédent
    const prevBtn = screen.getByRole('button', { name: /Précédent/i })
    fireEvent.click(prevBtn)

    // Retour à l'étape 1 avec valeurs conservées
    expect(screen.getByText(/Étape 1 sur 3/i)).toBeDefined()
    expect((screen.getByLabelText(/^Nom$/i) as HTMLInputElement).value).toBe('Rakoto')
  })

  it('valide le format email/téléphone à l’étape 2 et passe à l’étape 3', () => {
    render(<SignupForm />)

    // Étape 1
    fireEvent.change(screen.getByLabelText(/^Nom$/i), { target: { value: 'Rakoto' } })
    fireEvent.change(screen.getByLabelText(/Prénom\(s\)/i), { target: { value: 'Jean' } })
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

    // Étape 2 : Email invalide
    const emailInput = screen.getByLabelText(/^Email$/i)
    const phoneInput = screen.getByLabelText(/Téléphone/i)

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(phoneInput, { target: { value: '0340000000' } })
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

    expect(screen.getByText(/Veuillez saisir une adresse email valide/i)).toBeDefined()

    // Correction email
    fireEvent.change(emailInput, { target: { value: 'rakoto@exemple.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

    // Étape 3 atteinte
    expect(screen.getByText(/Étape 3 sur 3/i)).toBeDefined()
    expect(screen.getByLabelText(/^Mot de passe/i)).toBeDefined()
    expect(screen.getByLabelText(/Confirmation/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Créer mon compte/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Précédent/i })).toBeDefined()
  })

  it('ne duplique pas le lien "Retour à l\'accueil" en bas de la carte du formulaire', () => {
    render(<SignupForm />)

    const signinLink = screen.getByRole('link', { name: /Se connecter/i })
    expect(signinLink).toBeDefined()

    const card = signinLink.closest('.relative.z-10')
    const linksInCard = card ? card.querySelectorAll('a') : []
    const homeLinksInCard = Array.from(linksInCard).filter((a) =>
      a.textContent?.includes("Retour à l'accueil")
    )
    expect(homeLinksInCard.length).toBe(0)
  })
})
