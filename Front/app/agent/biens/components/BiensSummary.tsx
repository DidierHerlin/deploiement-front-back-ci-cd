'use client'
import { ArrowUpRight } from 'lucide-react'

export default function BiensSummary({ displayedCount, totalCount }: { displayedCount: number; totalCount: number }) {
  return (
    <div className="properties-summary">
      <span><strong>{displayedCount}</strong> biens affichés</span>
      <span>{totalCount} biens au total <ArrowUpRight size={14} /></span>
    </div>
  )
}
