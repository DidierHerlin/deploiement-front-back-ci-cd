'use client'

export default function BiensSummary({ displayedCount, totalCount }: { displayedCount: number; totalCount: number }) {
  return (
    <div className="agent-summary">
      <span><strong>{displayedCount}</strong> bien{displayedCount > 1 ? 's' : ''} affiché{displayedCount > 1 ? 's' : ''} sur {totalCount}</span>
      <span className="live"><i style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} /> Parc synchronisé</span>
    </div>
  )
}
