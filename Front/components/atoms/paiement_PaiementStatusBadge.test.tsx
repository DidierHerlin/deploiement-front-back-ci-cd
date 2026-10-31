import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PaiementStatusBadge } from './paiement_PaiementStatusBadge'

describe('PaiementStatusBadge - Affichage du statut des paiements', () => {
  it('affiche "Résilié" au lieu de "Annulé" lorsque le contrat associé est résilié (statut RESILIE)', () => {
    render(<PaiementStatusBadge statut="ANNULE" contratStatut="RESILIE" />)
    expect(screen.getByText('Résilié')).toBeDefined()
    expect(screen.queryByText('Annulé')).toBeNull()
  })

  it('affiche "Résilié" au lieu de "Annulé" lorsque le contratStatut est "RÉSILIÉ"', () => {
    render(<PaiementStatusBadge statut="ANNULE" contratStatut="RÉSILIÉ" />)
    expect(screen.getByText('Résilié')).toBeDefined()
    expect(screen.queryByText('Annulé')).toBeNull()
  })

  it('affiche "Annulé" pour un paiement annulé lorsque le contrat associé est non résilié (ACTIF)', () => {
    render(<PaiementStatusBadge statut="ANNULE" contratStatut="ACTIF" />)
    expect(screen.getByText('Annulé')).toBeDefined()
    expect(screen.queryByText('Résilié')).toBeNull()
  })

  it('affiche "Annulé" par défaut lorsqu’aucun contratStatut n’est fourni', () => {
    render(<PaiementStatusBadge statut="ANNULE" />)
    expect(screen.getByText('Annulé')).toBeDefined()
    expect(screen.queryByText('Résilié')).toBeNull()
  })

  it('affiche "Payé" pour un paiement payé même si le contrat est résilié', () => {
    render(<PaiementStatusBadge statut="PAYE" contratStatut="RESILIE" />)
    expect(screen.getByText('Payé')).toBeDefined()
    expect(screen.queryByText('Résilié')).toBeNull()
    expect(screen.queryByText('Annulé')).toBeNull()
  })

  it('affiche correctement les autres statuts standards (EN_ATTENTE, EN_RETARD, PARTIEL)', () => {
    const { rerender } = render(<PaiementStatusBadge statut="EN_ATTENTE" contratStatut="ACTIF" />)
    expect(screen.getByText('En attente')).toBeDefined()

    rerender(<PaiementStatusBadge statut="EN_RETARD" contratStatut="ACTIF" />)
    expect(screen.getByText('En retard')).toBeDefined()

    rerender(<PaiementStatusBadge statut="PARTIEL" contratStatut="ACTIF" />)
    expect(screen.getByText('Partiel')).toBeDefined()
  })

  it('affiche le badge distinctif "À vérifier (Mobile Money)" lorsque isMobileMoneyPending est vrai', () => {
    render(<PaiementStatusBadge statut="EN_ATTENTE" isMobileMoneyPending={true} />)
    expect(screen.getByText('À vérifier (Mobile Money)')).toBeDefined()
    expect(screen.queryByText('En attente')).toBeNull()
  })

  it('affiche "Payé" même si isMobileMoneyPending est fourni si le statut est déjà PAYE', () => {
    render(<PaiementStatusBadge statut="PAYE" isMobileMoneyPending={true} />)
    expect(screen.getByText('Payé')).toBeDefined()
    expect(screen.queryByText('À vérifier (Mobile Money)')).toBeNull()
  })
})
