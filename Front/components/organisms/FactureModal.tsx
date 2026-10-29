import { X, Building2, MapPin, Download, Receipt } from 'lucide-react'
import { Paiement } from '@/lib/api'
import { AgentActions } from '@/components/organisms/AgentActions'

interface FactureModalProps {
  paiement: Paiement
  isAgent: boolean
  onClose: () => void
  onStatusChange?: (updated: Paiement) => void
}

export function FactureModal({ paiement, isAgent, onClose, onStatusChange }: FactureModalProps) {
  const isLocation = paiement.part_proprietaire != null && paiement.commission_agent != null
  const baseAmount = parseFloat(paiement.montant_paye as string) || parseFloat(paiement.montant as string) || parseFloat(paiement.montant_attendu as string) || 0
  const displayAmount = isLocation 
    ? (isAgent ? Number(paiement.commission_agent) : Number(paiement.part_proprietaire))
    : baseAmount

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A'

  const printFacture = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:h-full print:rounded-none flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100">
        
        {/* Header - Not printed */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 print:hidden">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 m-0">
            <Receipt size={20} className="text-indigo-600 dark:text-indigo-400" />
            Facture de Gestion
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={printFacture} className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Imprimer">
              <Download size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-6 md:p-10 overflow-y-auto print:overflow-visible print:p-0">
          
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1.5">
                <Building2 size={28} />
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider m-0">Immo Gestion</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0">Votre partenaire de confiance</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-200 dark:text-slate-700 mb-1 uppercase m-0">Facture</h2>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base m-0">Réf : {paiement.reference || `FCT-${paiement.id.toString().padStart(5, '0')}`}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Date : {formatDate(paiement.date_paiement || paiement.date_echeance)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 m-0">Détails du Bien</h3>
              <p className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white m-0">{paiement.bien_titre || 'Bien Inconnu'}</p>
              <div className="flex gap-2 text-slate-600 dark:text-slate-400 mt-1 text-xs sm:text-sm">
                <MapPin size={16} className="shrink-0 mt-0.5 text-slate-400" />
                <span>Propriétaire : {paiement.locataire_nom ? 'Locataire existant' : 'Non précisé'}</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 m-0">Informations de Paiement</h3>
              <p className="text-xs sm:text-sm mb-1 m-0"><span className="text-slate-500 dark:text-slate-400">Période :</span> <strong className="text-slate-700 dark:text-slate-300">{paiement.message_mois || 'Paiement unique'}</strong></p>
              <p className="text-xs sm:text-sm mb-1 m-0"><span className="text-slate-500 dark:text-slate-400">Statut :</span> <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-xs">{paiement.statut}</span></p>
              <p className="text-xs sm:text-sm m-0"><span className="text-slate-500 dark:text-slate-400">Échéance :</span> <strong className="text-slate-700 dark:text-slate-300">{formatDate(paiement.date_echeance)}</strong></p>
            </div>
          </div>

          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</th>
                  <th className="py-2.5 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLocation ? (
                  <>
                    <tr>
                      <td className="py-3">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm m-0">{paiement.num_echeance === 1 ? 'Loyer + Dépôt de garantie' : 'Loyer mensuel brut'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Payé par le locataire</p>
                      </td>
                      <td className="py-3 text-right font-medium text-slate-900 dark:text-white text-xs sm:text-sm">{baseAmount.toLocaleString('fr-FR')} Ar</td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm m-0">Commission Agence (10%)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Déduite du loyer brut</p>
                      </td>
                      <td className="py-3 text-right font-medium text-rose-600 dark:text-rose-400 text-xs sm:text-sm">- {Number(paiement.commission_agent).toLocaleString('fr-FR')} Ar</td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm m-0">Part Propriétaire (90%)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Revenu net du propriétaire</p>
                      </td>
                      <td className="py-3 text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">{Number(paiement.part_proprietaire).toLocaleString('fr-FR')} Ar</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">Paiement pour Achat de bien</td>
                    <td className="py-3 text-right font-medium text-slate-900 dark:text-white text-xs sm:text-sm">{baseAmount.toLocaleString('fr-FR')} Ar</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-6">
            <div className="w-full max-w-sm bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl p-5 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex justify-between items-center text-indigo-900 dark:text-indigo-200 mb-2">
                <span className="font-semibold text-xs sm:text-sm">{isAgent ? 'Votre Commission Nette' : 'Votre Revenu Net'}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-300 text-right">
                {displayAmount.toLocaleString('fr-FR')} Ar
              </div>
              {paiement.est_partiel && (
                <div className="text-right text-xs text-orange-600 dark:text-orange-400 font-bold mt-2">
                  Reste à payer : {parseFloat(paiement.montant_restant || '0').toLocaleString('fr-FR')} Ar
                </div>
              )}
            </div>
          </div>

          {isAgent && paiement.statut === 'EN_ATTENTE' && (
            <div className="print:hidden mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
              <AgentActions paiement={paiement} onStatusChange={(updated) => { if (onStatusChange) onStatusChange(updated); onClose(); }} />
            </div>
          )}
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="m-0">Document généré électroniquement. Valable sans signature.</p>
            <p className="m-0 mt-1">Pour toute question, contactez contact@immogestion.mg</p>
          </div>

        </div>
      </div>
    </div>
  )
}
