'use client'
import { ArrowUpRight, MoreHorizontal } from 'lucide-react'
import { AgentDashboardData } from '../hooks/useAgentDashboard';

export default function EstatePanel({ data }: { data: AgentDashboardData }) {
  const { biens } = data;
  
  const totalBiens = biens.length;
  const loues = biens.filter(b => b.statut === 'LOUE').length;
  const dispos = biens.filter(b => b.statut === 'DISPONIBLE').length;
  const travaux = biens.filter(b => b.statut === 'EN_TRAVAUX').length;

  const getPct = (val: number) => totalBiens > 0 ? ((val / totalBiens) * 100).toFixed(1) : '0.0';
  
  const pctLoues = totalBiens > 0 ? (loues / totalBiens) * 100 : 0;
  const pctDispos = totalBiens > 0 ? (dispos / totalBiens) * 100 : 0;
  
  const degLoues = (pctLoues / 100) * 360;
  const degDispos = (pctDispos / 100) * 360;

  const gradient = totalBiens > 0 
    ? `conic-gradient(var(--primary) 0deg ${degLoues}deg, var(--green) ${degLoues}deg ${degLoues + degDispos}deg, var(--orange) ${degLoues + degDispos}deg 360deg)`
    : `conic-gradient(#eef0f4 0deg 360deg)`;

  return (
    <article className="panel estate-panel">
      <div className="panel-header">
        <div><p className="section-kicker">VUE D&apos;ENSEMBLE</p><h2>État du parc immobilier</h2></div>
        <button className="more-button" aria-label="Plus d'options"><MoreHorizontal size={19} /></button>
      </div>
      <div className="estate-body">
        <div className="donut-wrap">
          <div className="donut" style={{ background: gradient }}>
            <div><strong>{totalBiens}</strong><span>biens gérés</span></div>
          </div>
        </div>
        <div className="legend">
          <div><span className="legend-dot" style={{ background: 'var(--primary)' }} /><div><b>Loués</b><small>{loues} biens</small></div><strong>{getPct(loues)} %</strong></div>
          <div><span className="legend-dot" style={{ background: 'var(--green)' }} /><div><b>Disponibles</b><small>{dispos} biens</small></div><strong>{getPct(dispos)} %</strong></div>
          <div><span className="legend-dot" style={{ background: 'var(--orange)' }} /><div><b>En travaux</b><small>{travaux} biens</small></div><strong>{getPct(travaux)} %</strong></div>
        </div>
      </div>
      <button className="text-link">Voir tous les biens <ArrowUpRight size={15} /></button>
    </article>
  )
}
