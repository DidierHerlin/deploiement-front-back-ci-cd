import { X, FileText } from 'lucide-react'
import { Contrat, Bien, Locataire, getBienInfo } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'

type ContratFormProps = {
  editingContrat: Contrat | null
  disponiblesBiens: Bien[]
  locataires: Locataire[]
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
}

export function ContratForm({ editingContrat, disponiblesBiens, locataires, onClose, onSubmit }: ContratFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<any>({
    type_contrat: 'LOCATION',
    bien: '',
    locataire: '',
    date_debut: '',
    date_fin: '',
    loyer: '',
    depot_garantie: '',
    prix: '',
    type_paiement_achat: 'TOTALITE'
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingContrat) {
      setFormData({
        type_contrat: editingContrat.type_contrat,
        bien: editingContrat.bien,
        locataire: editingContrat.locataire,
        date_debut: editingContrat.date_debut || '',
        date_fin: editingContrat.date_fin || '',
        loyer: editingContrat.loyer || '',
        depot_garantie: editingContrat.depot_garantie || '',
        prix: editingContrat.prix || '',
        type_paiement_achat: editingContrat.type_paiement_achat || 'TOTALITE'
      })
    }
  }, [editingContrat])

  const handleBienChange = async (bienId: string) => {
    setFormData((prev: any) => ({ ...prev, bien: bienId }))
    if (!bienId) return
    
    try {
      const res = await getBienInfo(Number(bienId))
      const mode = res.mode_transaction
      // Mettre à jour le formulaire avec les valeurs par défaut
      setFormData((prev: any) => ({
        ...prev,
        type_contrat: mode === 'VENTE' ? 'ACHAT' : 'LOCATION',
        loyer: mode === 'LOCATION' ? res.loyer_mensuel : '',
        prix: mode === 'VENTE' ? res.prix : '',
        depot_garantie: mode === 'LOCATION' && res.loyer_mensuel ? res.loyer_mensuel * 2 : ''
      }))
    } catch (e) {
      console.error("Erreur récupération infos bien", e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const payload: any = { ...formData }
    
    // Nettoyer le payload selon le type
    if (payload.type_contrat === 'LOCATION') {
      delete payload.prix
      delete payload.type_paiement_achat
      if (!payload.date_fin) delete payload.date_fin
    } else {
      delete payload.loyer
      delete payload.depot_garantie
      delete payload.date_debut
      delete payload.date_fin
    }
    
    try {
      await onSubmit(payload)
    } catch (err: any) {
      setError(err.message || t("forms.error", 'Erreur lors de l\'enregistrement'))
    } finally {
      setLoading(false)
    }
  }

  const isLocation = formData.type_contrat === 'LOCATION'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="presentation">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
        role="dialog" 
        aria-modal="true"
      >
        <button 
          type="button" 
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
          onClick={onClose} 
          aria-label={t("forms.close", "Fermer")}
        >
          <X size={18} />
        </button>
        
        <div className="flex-shrink-0 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
            <FileText size={20} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {editingContrat ? t("admin.contrats.edit_title", 'Modifier le contrat') : t("admin.contrats.create_title", 'Nouveau Contrat')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {editingContrat ? t("admin.contrats.edit_sub", "Mettez à jour les termes du contrat.") : t("admin.contrats.create_sub", "Associez un bien disponible à un locataire.")}
          </p>
          
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-lg p-3 text-xs mt-3">
              {error}
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("admin.contrats.col_tenant", "Locataire / Acheteur *")}
              </label>
              <select 
                required 
                value={formData.locataire} 
                onChange={e => setFormData({ ...formData, locataire: e.target.value })} 
                disabled={!!editingContrat} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              >
                <option value="">{t("forms.select_placeholder", "-- Sélectionner --")}</option>
                {locataires.map(l => (
                  <option key={l.id} value={l.id}>{l.user?.prenoms} {l.user?.nom}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("admin.contrats.col_property", "Bien immobilier *")}
              </label>
              <select 
                required 
                value={formData.bien} 
                onChange={e => handleBienChange(e.target.value)} 
                disabled={!!editingContrat} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              >
                <option value="">{t("forms.select_placeholder", "-- Sélectionner --")}</option>
                {editingContrat && <option value={editingContrat.bien}>{editingContrat.bien_titre}</option>}
                {disponiblesBiens.map(b => (
                  <option key={b.id} value={b.id}>{b.titre} ({b.mode_transaction})</option>
                ))}
              </select>
            </div>

            <div className="col-span-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("admin.contrats.col_type", "Type de contrat *")}
              </label>
              <select 
                required 
                value={formData.type_contrat} 
                onChange={e => setFormData({ ...formData, type_contrat: e.target.value })} 
                disabled 
                className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              >
                <option value="LOCATION">{t("card.for_rent", "Location")}</option>
                <option value="ACHAT">{t("card.for_sale", "Achat")}</option>
              </select>
              <small className="text-slate-500 dark:text-slate-400 text-xs">
                {t("admin.contrats.type_auto_note", "Le type est déterminé automatiquement en fonction du bien sélectionné.")}
              </small>
            </div>

            {isLocation ? (
              <>
                <div className="col-span-full pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {t("admin.contrats.financial_terms_rent", "Conditions financières (Location)")}
                  </h3>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("forms.monthly_rent", "Loyer mensuel *")}
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.loyer} 
                    onChange={e => setFormData({ ...formData, loyer: e.target.value })} 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("locataire_pages.contrat.card_deposit", "Dépôt de garantie *")}
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.depot_garantie} 
                    onChange={e => setFormData({ ...formData, depot_garantie: e.target.value })} 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-full pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {t("admin.contrats.col_period", "Période")}
                  </h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("admin.contrats.col_start_date", "Date de début *")}
                  </label>
                  <input 
                    type="date" 
                    required 
                    value={formData.date_debut} 
                    onChange={e => setFormData({ ...formData, date_debut: e.target.value })} 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("admin.contrats.end_date", "Date de fin")}
                  </label>
                  <input 
                    type="date" 
                    value={formData.date_fin} 
                    onChange={e => setFormData({ ...formData, date_fin: e.target.value })} 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="col-span-full pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {t("admin.contrats.financial_terms_sale", "Conditions financières (Achat)")}
                  </h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("forms.sale_price", "Prix de vente *")}
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.prix} 
                    onChange={e => setFormData({ ...formData, prix: e.target.value })} 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("admin.contrats.payment_mode_label", "Modalité de paiement *")}
                  </label>
                  <select 
                    required 
                    value={formData.type_paiement_achat} 
                    onChange={e => setFormData({ ...formData, type_paiement_achat: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="TOTALITE">{t("admin.contrats.payment_full", "Comptant (100%)")}</option>
                    <option value="PARTIEL">{t("admin.contrats.payment_installment", "Échelonné (50% puis mensualités)")}</option>
                  </select>
                </div>
              </>
            )}

          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 flex items-center justify-end gap-3 flex-shrink-0">
            <button 
              type="button" 
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors" 
              onClick={onClose} 
              disabled={loading}
            >
              {t("forms.cancel", "Annuler")}
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors" 
              disabled={loading}
            >
              {loading ? t("forms.saving", 'Enregistrement...') : t("forms.save", 'Enregistrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
