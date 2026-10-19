import { Paiement, PaiementStatsData } from '@/lib/api'

type PaiementStatsProps = {
  paiements: Paiement[]
  user?: { id?: number } | null
  userId?: number
  stats?: PaiementStatsData | null
}

export function PaiementStats({ paiements, user, userId, stats }: PaiementStatsProps) {
  // 1. Filtrer les factures en fonction de l'identifiant (id) de l'utilisateur connecté
  const currentUserId = userId ?? user?.id

  // Filtrage strict : si des factures comportent un locataire_user_id,
  // seules celles appartenant à l'utilisateur connecté sont conservées.
  const userPaiements = currentUserId
    ? paiements.filter(p => p.locataire_user_id === undefined || p.locataire_user_id === currentUserId)
    : paiements

  const total = stats ? stats.total : userPaiements.length
  
  // 2. Factures effectivement payées et confirmées :
  // - Statut confirmé : 'PAYE' ou 'VALIDE'
  // - Exclure les factures en attente ('EN_ATTENTE')
  // - Exclure les factures en retard ('EN_RETARD')
  // - Exclure les factures partiellement payées (est_partiel === true ou statut === 'PARTIEL')
  // - Exclure les factures annulées ('ANNULE')
  const facturesPayees = userPaiements.filter(p => {
    const isPayeOuValide = p.statut === 'PAYE' || p.statut === 'VALIDE'
    const isPartiel = p.est_partiel === true || p.statut === 'PARTIEL'
    const isEnRetard = p.statut === 'EN_RETARD'
    const isEnAttente = p.statut === 'EN_ATTENTE'
    const isAnnule = p.statut === 'ANNULE'

    return isPayeOuValide && !isPartiel && !isEnRetard && !isEnAttente && !isAnnule
  })

  // Somme des montants des factures effectivement payées
  const calculatedTotalEncaisse = facturesPayees.reduce((acc, p) => {
    const montant = parseFloat(p.montant || '0')
    if (montant > 0) return acc + montant

    const montantAttendu = parseFloat(p.montant_attendu || '0')
    if (montantAttendu > 0) return acc + montantAttendu

    const montantPaye = parseFloat(p.montant_paye || '0')
    if (montantPaye > 0) return acc + montantPaye

    return acc
  }, 0)

  // Utilisation de la valeur backend si disponible, sinon calcul local
  const totalEncaisse = stats?.total_encaisse !== undefined ? stats.total_encaisse : calculatedTotalEncaisse

  // Total attendu / en attente (EN_ATTENTE, EN_RETARD, PARTIEL)
  const calculatedMontantRestant = userPaiements
    .filter(p => ['EN_ATTENTE', 'EN_RETARD', 'PARTIEL'].includes(p.statut) || p.est_partiel)
    .reduce((acc, p) => {
      const restant = parseFloat(p.montant_restant || '0')
      if (restant > 0) return acc + restant

      const attendu = parseFloat(p.montant_attendu || p.montant || '0')
      const paye = parseFloat(p.montant_paye || '0')
      return acc + Math.max(attendu - paye, 0)
    }, 0)

  const montantRestant = stats?.montant_restant !== undefined ? stats.montant_restant : calculatedMontantRestant

  const countPaye = stats ? stats.count_paye : facturesPayees.length
  const countAttente = stats ? stats.count_attente : userPaiements.filter(p => p.statut === 'EN_ATTENTE').length
  const countRetard = stats ? stats.count_retard : userPaiements.filter(p => p.statut === 'EN_RETARD').length

  const formatMontant = (m: number) => m.toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' Ar'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Total des paiements</p>
        <p style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: 600, color: '#0f172a' }}>{total}</p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', fontSize: '13px' }}>
          <span style={{ color: '#10b981' }}>{countPaye} payés</span>
          <span style={{ color: '#f59e0b' }}>{countAttente} en attente</span>
          <span style={{ color: '#ef4444' }}>{countRetard} en retard</span>
        </div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Montant total encaissé</p>
        <p style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: 600, color: '#10b981' }}>{formatMontant(totalEncaisse)}</p>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Montant restant à payer</p>
        <p style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: 600, color: '#ef4444' }}>{formatMontant(montantRestant)}</p>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#64748b' }}>(Inclut les retards et paiements partiels)</p>
      </div>
      
    </div>
  )
}

