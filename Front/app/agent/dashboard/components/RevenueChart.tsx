'use client'
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'
import { AgentDashboardData } from '../hooks/useAgentDashboard';

export default function RevenueChart({ data }: { data: AgentDashboardData }) {
  const { paiements } = data;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;

  let revCurrent = 0;
  let revLast = 0;

  paiements.forEach(p => {
    if (p.statut === 'PAYE' && p.date_paiement) {
      const d = new Date(p.date_paiement);
      const val = parseFloat(p.loyer_contrat || '0');
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        revCurrent += val;
      } else if (d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth) {
        revLast += val;
      }
    }
  });

  const trend = revLast > 0 ? ((revCurrent - revLast) / revLast) * 100 : 0;
  const isPositive = trend >= 0;

  return (
    <article className="panel activity-panel">
      <div className="panel-header">
        <div><p className="section-kicker">ACTIVITÉ LOCATIVE</p><h2>Revenus locatifs</h2></div>
        <button className="more-button" aria-label="Plus d'options"><MoreHorizontal size={19} /></button>
      </div>
      <div className="revenue-head">
        <strong>{revCurrent.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar</strong>
        {revLast > 0 && (
          <span className={isPositive ? "positive" : "negative"} style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
            {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} 
            {Math.abs(trend).toFixed(1)} %
          </span>
        )}
        <small>vs. mois dernier</small>
      </div>
      <div className="chart">
        <div className="chart-labels"><span>60k</span><span>40k</span><span>20k</span><span>0</span></div>
        <div className="chart-area">
          <div className="grid-line one"/><div className="grid-line two"/><div className="grid-line three"/>
          <svg viewBox="0 0 520 130" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2563eb" stopOpacity=".22"/>
                <stop offset="1" stopColor="#2563eb" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0 119 C38 115, 46 95, 82 102 S120 104, 143 83 S180 96, 207 75 S242 89, 267 65 S301 78, 326 51 S360 66, 386 44 S421 54, 450 29 S488 42, 520 12" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
            <path d="M0 119 C38 115, 46 95, 82 102 S120 104, 143 83 S180 96, 207 75 S242 89, 267 65 S301 78, 326 51 S360 66, 386 44 S421 54, 450 29 S488 42, 520 12 L520 130 L0 130 Z" fill="url(#chartGrad)"/>
          </svg>
          <div className="chart-months"><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span></div>
        </div>
      </div>
    </article>
  )
}
