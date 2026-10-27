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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <p className="m-0 text-sm font-medium text-slate-500 dark:text-slate-400">Total des paiements</p>
        <p className="mt-2.5 mb-0 text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
        <div className="mt-2.5 flex flex-wrap gap-2.5 text-xs font-semibold">
          <span className="text-emerald-600 dark:text-emerald-400">{countPaye} payés</span>
          <span className="text-amber-600 dark:text-amber-400">{countAttente} en attente</span>
          <span className="text-rose-600 dark:text-rose-400">{countRetard} en retard</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <p className="m-0 text-sm font-medium text-slate-500 dark:text-slate-400">Montant total encaissé</p>
        <p className="mt-2.5 mb-0 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatMontant(totalEncaisse)}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <p className="m-0 text-sm font-medium text-slate-500 dark:text-slate-400">Montant restant à payer</p>
        <p className="mt-2.5 mb-0 text-2xl font-bold text-rose-600 dark:text-rose-400">{formatMontant(montantRestant)}</p>
        <p className="mt-1 mb-0 text-xs text-slate-500 dark:text-slate-400">(Inclut les retards et paiements partiels)</p>
      </div>
      
    </div>
  )
}

