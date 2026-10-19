import { useState } from 'react'
import { Paiement, Contrat } from '@/lib/api'
import { PaiementTableRow } from "@/components/organisms/PaiementTableRow"
import { Pagination } from "@/components/molecules/pagination"

type PaiementTableProps = {
  paiements: Paiement[]
  contrats?: Contrat[]
  loading: boolean
  error?: string | null
  allowResilie?: boolean
  emptyMessage?: string
  onView: (p: Paiement) => void
  onEdit: (p: Paiement) => void
  onValiderDemande?: (p: Paiement) => void
  onRefuserDemande?: (p: Paiement) => void
}

export function PaiementTable({ 
  paiements, 
  contrats, 
  loading, 
  error, 
  allowResilie = false,
  emptyMessage,
  onView, 
  onEdit, 
  onValiderDemande, 
  onRefuserDemande 
}: PaiementTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const isContratResilie = (p: Paiement): boolean => {
    const directStatut = (p as any).contrat_statut;
    if (typeof directStatut === 'string') {
      const s = directStatut.trim().toUpperCase();
      if (s === 'RESILIE' || s === 'RÉSILIÉ') return true;
    }
    if (typeof p.contrat === 'object' && p.contrat !== null) {
      const s = (p.contrat as any).statut;
      if (typeof s === 'string') {
        const sUpper = s.trim().toUpperCase();
        if (sUpper === 'RESILIE' || sUpper === 'RÉSILIÉ') return true;
      }
    }
    const contratId = typeof p.contrat === 'object' && p.contrat !== null ? (p.contrat as any).id : p.contrat;
    if (contratId && contrats && contrats.length > 0) {
      const c = contrats.find(contrat => contrat.id === contratId);
      if (c?.statut) {
        const sUpper = c.statut.trim().toUpperCase();
        if (sUpper === 'RESILIE' || sUpper === 'RÉSILIÉ') return true;
      }
    }
    if (p.statut === 'RESILIE' || p.statut === 'RÉSILIÉ') return true;
    return false;
  };

  const paiementsVisibles = allowResilie ? paiements : paiements.filter(p => !isContratResilie(p));
  const totalPages = Math.ceil(paiementsVisibles.length / ITEMS_PER_PAGE);
  const paginatedData = paiementsVisibles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-wrap" style={{ flex: 1 }}>
        <table>
          <thead>
            <tr>
              <th>Réf / Échéance</th>
              <th>Bien immobilier</th>
              <th>Locataire / Acheteur</th>
              <th>Montant</th>
              <th>Dates (Prévu / Payé)</th>
              <th>Statut</th>
              <th>Mode</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>Chargement...</td></tr>
            ) : error ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#dc2626' }}>{error}</td></tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map(p => (
                <PaiementTableRow 
                  key={p.id}
                  paiement={p}
                  contrats={contrats}
                  onView={onView}
                  onEdit={onEdit}
                  onValiderDemande={onValiderDemande}
                  onRefuserDemande={onRefuserDemande}
                />
              ))
            ) : (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>{emptyMessage || "Aucun paiement trouvé."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
