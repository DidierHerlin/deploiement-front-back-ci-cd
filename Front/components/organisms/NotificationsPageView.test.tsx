import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationsPageView } from './NotificationsPageView'
import * as api from '@/lib/api'

const mockPush = vi.fn()

vi.mock('@/lib/api', () => ({
  getNotifications: vi.fn(),
  markNotificationsAsRead: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockNotifications: api.Notification[] = [
  {
    id: 1,
    utilisateur: 1,
    type: 'ECHEANCE_PROCHE',
    type_display: 'Échéance proche',
    titre: 'Loyer en attente',
    message: 'Votre loyer de 150000 Ar est à régler avant le 5.',
    lien: '/api/paiements/1',
    date_creation: '2026-10-25T10:00:00Z',
    lu: false,
    email_envoye: true,
  },
  {
    id: 2,
    utilisateur: 1,
    type: 'PAIEMENT_VALIDE',
    type_display: 'Paiement validé',
    titre: 'Paiement reçu',
    message: 'Votre paiement de 150000 Ar a été validé.',
    lien: '/api/quittance/1.pdf',
    date_creation: '2026-10-20T14:30:00Z',
    lu: true,
    email_envoye: true,
  },
]

describe('NotificationsPageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getNotifications).mockResolvedValue(mockNotifications)
  })

  it('affiche les notifications avec leurs badges et statistiques', async () => {
    render(<NotificationsPageView role="LOCATAIRE" />)

    // Vérifie le titre
    expect(await screen.findByText(/Centre de notifications/i)).toBeDefined()

    // Vérifie les notifications affichées
    expect(await screen.findByText(/Loyer en attente/i)).toBeDefined()
    expect(await screen.findByText(/Paiement reçu/i)).toBeDefined()

    // Vérifie le filtre et le comptage
    expect(screen.getByText(/Toutes les alertes/i)).toBeDefined()
  })

  it('permet de marquer toutes les notifications comme lues', async () => {
    vi.mocked(api.markNotificationsAsRead).mockResolvedValue({ success: true })
    render(<NotificationsPageView role="LOCATAIRE" />)

    const markAllBtn = await screen.findByRole('button', { name: /Tout marquer comme lu/i })
    expect(markAllBtn).toBeDefined()
    fireEvent.click(markAllBtn)

    await waitFor(() => {
      expect(api.markNotificationsAsRead).toHaveBeenCalled()
    })
  })

  it('permet de filtrer les notifications non lues', async () => {
    render(<NotificationsPageView role="LOCATAIRE" />)

    await screen.findByText(/Loyer en attente/i)

    // Clique sur le tab 'Non lues'
    const unreadTab = screen.getByRole('button', { name: /Non lues/i })
    fireEvent.click(unreadTab)

    // La notification non lue reste affichée
    expect(screen.getByText(/Loyer en attente/i)).toBeDefined()
    // La notification déjà lue doit être masquée
    expect(screen.queryByText(/Paiement reçu/i)).toBeNull()
  })

  it('redirige dynamiquement un locataire vers /espace-locataire/quittances lors du clic sur une notification de paiement/quittance sans appel fetch direct', async () => {
    render(<NotificationsPageView role="LOCATAIRE" />)

    const notifItem = await screen.findByText(/Paiement reçu/i)
    fireEvent.click(notifItem)

    expect(mockPush).toHaveBeenCalledWith('/espace-locataire/quittances')
  })

  it('redirige dynamiquement un propriétaire vers /espace-proprietaire/paiements lors du clic sur une notification de paiement/quittance', async () => {
    render(<NotificationsPageView role="PROPRIETAIRE" />)

    const notifItem = await screen.findByText(/Paiement reçu/i)
    fireEvent.click(notifItem)

    expect(mockPush).toHaveBeenCalledWith('/espace-proprietaire/paiements')
  })
})
