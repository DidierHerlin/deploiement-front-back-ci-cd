import { useState } from 'react'
import { Paiement, Contrat } from '@/lib/api'
import { PaiementTableRow } from "@/components/organisms/PaiementTableRow"
import { Pagination } from "@/components/molecules/pagination"
import { useTranslation } from '@/lib/i18n'

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
  const { t } = useTranslation()
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
              <th>{t("admin.paiements.col_ref_due", "Réf / Échéance")}</th>
              <th>{t("admin.contrats.col_property", "Bien immobilier")}</th>
              <th>{t("admin.contrats.col_tenant", "Locataire / Acheteur")}</th>
              <th>{t("admin.paiements.col_amount", "Montant")}</th>
              <th>{t("admin.paiements.col_dates_expected_paid", "Dates (Prévu / Payé)")}</th>
              <th>{t("admin.paiements.col_status", "Statut")}</th>
              <th>{t("admin.paiements.col_mode", "Mode")}</th>
              <th style={{ textAlign: 'right' }}>{t("admin.paiements.col_actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>{t("forms.loading", "Chargement...")}</td></tr>
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
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#8993a3' }}>{emptyMessage || t("admin.paiements.empty", "Aucun paiement trouvé.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
