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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:h-full print:rounded-none flex flex-col max-h-[90vh]">
        
        {/* Header - Not printed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50 print:hidden">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Receipt size={20} className="text-indigo-600" />
            Facture de Gestion
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={printFacture} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Imprimer">
              <Download size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 md:p-12 overflow-y-auto print:overflow-visible print:p-0 text-gray-800">
          
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Building2 size={32} />
                <h1 className="text-2xl font-black uppercase tracking-wider">Immo Gestion</h1>
              </div>
              <p className="text-sm text-gray-500">Votre partenaire de confiance</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black text-gray-200 mb-2 uppercase">Facture</h2>
              <p className="font-semibold text-gray-800 text-lg">Réf : {paiement.reference || `FCT-${paiement.id.toString().padStart(5, '0')}`}</p>
              <p className="text-sm text-gray-500">Date : {formatDate(paiement.date_paiement || paiement.date_echeance)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Détails du Bien</h3>
              <p className="font-semibold text-lg">{paiement.bien_titre || 'Bien Inconnu'}</p>
              <div className="flex gap-2 text-gray-600 mt-1 text-sm">
                <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400" />
                <span>Propriétaire : {paiement.locataire_nom ? 'Locataire existant' : 'Non précisé'}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informations de Paiement</h3>
              <p className="text-sm mb-1"><span className="text-gray-500">Période :</span> {paiement.message_mois || 'Paiement unique'}</p>
              <p className="text-sm mb-1"><span className="text-gray-500">Statut :</span> <span className="font-bold text-green-600 uppercase text-xs">{paiement.statut}</span></p>
              <p className="text-sm"><span className="text-gray-500">Échéance :</span> {formatDate(paiement.date_echeance)}</p>
            </div>
          </div>

          <div className="mb-12">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="py-3 font-bold text-sm uppercase tracking-wider text-gray-500">Description</th>
                  <th className="py-3 font-bold text-sm uppercase tracking-wider text-gray-500 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLocation ? (
                  <>
                    <tr>
                      <td className="py-4">
                        <p className="font-semibold">{paiement.num_echeance === 1 ? 'Loyer + Dépôt de garantie' : 'Loyer mensuel brut'}</p>
                        <p className="text-xs text-gray-500">Payé par le locataire</p>
                      </td>
                      <td className="py-4 text-right font-medium">{baseAmount.toLocaleString('fr-FR')} Ar</td>
                    </tr>
                    <tr>
                      <td className="py-4">
                        <p className="font-semibold">Commission Agence (10%)</p>
                        <p className="text-xs text-gray-500">Déduite du loyer brut</p>
                      </td>
                      <td className="py-4 text-right font-medium text-red-600">- {Number(paiement.commission_agent).toLocaleString('fr-FR')} Ar</td>
                    </tr>
                    <tr>
                      <td className="py-4">
                        <p className="font-semibold">Part Propriétaire (90%)</p>
                        <p className="text-xs text-gray-500">Revenu net du propriétaire</p>
                      </td>
                      <td className="py-4 text-right font-medium text-green-600">{Number(paiement.part_proprietaire).toLocaleString('fr-FR')} Ar</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td className="py-4 font-semibold">Paiement pour Achat de bien</td>
                    <td className="py-4 text-right font-medium">{baseAmount.toLocaleString('fr-FR')} Ar</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-full max-w-sm bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
              <div className="flex justify-between items-center text-indigo-900 mb-2">
                <span className="font-semibold">{isAgent ? 'Votre Commission Nette' : 'Votre Revenu Net'}</span>
              </div>
              <div className="text-3xl font-black text-indigo-700 text-right">
                {displayAmount.toLocaleString('fr-FR')} Ar
              </div>
              {paiement.est_partiel && (
                <div className="text-right text-xs text-orange-600 font-bold mt-2">
                  Reste à payer : {parseFloat(paiement.montant_restant || '0').toLocaleString('fr-FR')} Ar
                </div>
              )}
            </div>
          </div>

          {isAgent && paiement.statut === 'EN_ATTENTE' && (
            <div className="print:hidden mt-8 border-t border-gray-100 pt-6">
              <AgentActions paiement={paiement} onStatusChange={(updated) => { if (onStatusChange) onStatusChange(updated); onClose(); }} />
            </div>
          )}
          <div className="text-center text-xs text-gray-400 mt-auto pt-8 border-t border-gray-100">
            <p>Document généré électroniquement. Valable sans signature.</p>
            <p>Pour toute question, contactez contact@immogestion.mg</p>
          </div>

        </div>
      </div>
    </div>
  )
}


