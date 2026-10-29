import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProprietaireLayout } from './ProprietaireLayout'
import * as api from '@/lib/api'

vi.mock('@/lib/auth', () => ({
  deconnecter: vi.fn(),
  getAccessToken: vi.fn().mockReturnValue('mock-token'),
}))

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getProfil: vi.fn().mockResolvedValue({
      id: 1,
      nom: 'Herlin',
      prenoms: 'Didier',
      email: 'didier.herlin@example.com',
      role: 'PROPRIETAIRE',
    }),
    getNotifications: vi.fn().mockResolvedValue([]),
    markNotificationsAsRead: vi.fn().mockResolvedValue({ success: true }),
  }
})

vi.mock('next/navigation', () => ({
  usePathname: () => '/proprietaire/dashboard',
}))

describe('ProprietaireLayout', () => {
  it('intègre le commutateur de thème et affiche le nom utilisateur avec le bon contraste', async () => {
    const { container } = render(
      <ProprietaireLayout>
        <div>Contenu test</div>
      </ProprietaireLayout>
    )

    // Vérifie que le ThemeToggle est présent dans la topbar
    const themeButton = await screen.findByRole('button', { name: /mode d'affichage/i })
    expect(themeButton).toBeDefined()

    // Vérifie que le nom d'utilisateur est bien présent dans la topbar avec les classes de contraste Dark Mode
    const userNames = await screen.findAllByText(/Didier Herlin/i)
    expect(userNames.length).toBeGreaterThan(0)
    
    // Au moins un des éléments (dans la topbar) a les classes de contraste
    const topbarUserName = userNames.find(el => el.className.includes('text-slate-700') && el.className.includes('dark:text-slate-200'))
    expect(topbarUserName).toBeDefined()

    // Vérifie que l'encadré redondant owner-help a été supprimé de la sidebar
    expect(container.querySelector('.owner-help')).toBeNull()
  })
})
