import React from 'react';
import { LucideIcon } from 'lucide-react';

export function StatCard({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon, label: string, value: string, detail: string, tone: string }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="stat-copy">
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}
