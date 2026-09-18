import { Paiement } from '@/lib/api'

type PaiementStatsProps = {
  paiements: Paiement[]
}

export function PaiementStats({ paiements }: PaiementStatsProps) {
  const total = paiements.length
  
  // Totalencaissé (uniquement statuts PAYE)
  const totalEncaisse = paiements
    .filter(p => p.statut === 'PAYE')
    .reduce((acc, p) => acc + (parseFloat(p.montant_paye || p.montant || '0')), 0)

  // Total attendu / en attente (EN_ATTENTE, EN_RETARD, PARTIEL)
  const montantRestant = paiements
    .filter(p => ['EN_ATTENTE', 'EN_RETARD', 'PARTIEL'].includes(p.statut))
    .reduce((acc, p) => acc + (parseFloat(p.montant_restant || p.montant_attendu || '0')), 0)

  const countPaye = paiements.filter(p => p.statut === 'PAYE').length
  const countAttente = paiements.filter(p => p.statut === 'EN_ATTENTE').length
  const countRetard = paiements.filter(p => p.statut === 'EN_RETARD').length

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
