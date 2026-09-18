'use client'
import { ArrowUpRight, FileText, X } from 'lucide-react'

export default function PendingBanner() {
  return (
    <section className="pending-banner" style={{ background: '#f5f8ff', borderColor: '#dbeafe' }}>
      <div className="pending-icon" style={{ background: '#dbeafe', color: 'var(--primary)' }}><FileText size={20} /></div>
      <div>
        <p style={{ color: 'var(--navy)' }}>Nouveaux dossiers locataires</p>
        <span style={{ color: 'var(--text-secondary)' }}>4 dossiers attendent votre validation pour des biens disponibles.</span>
      </div>
      <button style={{ background: 'var(--primary)' }}>Consulter les dossiers <ArrowUpRight size={15} /></button>
      <button className="close-banner" aria-label="Fermer"><X size={17} /></button>
    </section>
  )
}
