"use client"

import React, { useState, useEffect } from "react"
import { Check, X, FileText } from "lucide-react"
import { getBiensDisponibles, getLocataires, getBienInfo, BienListItem, Locataire, CreerContratPayload, Contrat, Bien } from "@/lib/api"
import { useTranslation } from '@/lib/i18n'

export type ContratFormProps = {
  // Mode Agent (Page complète)
  initialData?: Partial<CreerContratPayload>
  onSubmit?: ((data: CreerContratPayload) => void) | ((payload: any) => Promise<void>)
  onCancel?: () => void
  isSubmitting?: boolean
  title?: string

  // Mode Admin (Modal)
  editingContrat?: Contrat | null
  disponiblesBiens?: Bien[]
  locataires?: Locataire[]
  onClose?: () => void
}

const emptyForm: CreerContratPayload = {
  bien: 0,
  locataire: 0,
  type_contrat: "LOCATION",
  date_debut: new Date().toISOString().split('T')[0],
  date_fin: "",
  loyer: "",
  depot_garantie: "",
  prix: "",
}

export function ContratForm(props: ContratFormProps) {
  const { t } = useTranslation()

  // ─────────────────────────────────────────────────────────────
  // 1. CAS ADMIN (MODAL) : si disponiblesBiens ou onClose fournis
  // ─────────────────────────────────────────────────────────────
  if (props.disponiblesBiens !== undefined || props.onClose) {
    const { editingContrat, disponiblesBiens = [], locataires = [], onClose = () => {}, onSubmit = async () => {} } = props
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
        setFormData((prev: any) => ({
          ...prev,
          type_contrat: mode === 'VENTE' ? 'ACHAT' : 'LOCATION',
          loyer: mode === 'LOCATION' ? res.loyer_mensuel : '',
          prix: mode === 'VENTE' ? res.prix : '',
          depot_garantie: mode === 'LOCATION' && res.loyer_mensuel ? (parseFloat(res.loyer_mensuel as any) * 2).toString() : ''
        }))
      } catch (e) {
        console.error("Erreur auto-fill bien:", e)
      }
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')
      try {
        await (onSubmit as any)(formData)
        onClose()
      } catch (err: any) {
        setError(err.message || t("forms.error", 'Erreur lors de l\'enregistrement'))
      } finally {
        setLoading(false)
      }
    }

    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" 
        role="presentation"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contrat-modal-title"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h2 id="contrat-modal-title" className="text-base font-bold text-slate-900 dark:text-white m-0">
                  {editingContrat ? t("admin.contrats.edit_contract", "Modifier le contrat") : t("admin.contrats.new_contract", "Nouveau contrat")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                  {t("admin.contrats.form_subtitle", "Définissez les clauses et signataires du contrat.")}
                </p>
              </div>
            </div>
            <button 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              onClick={onClose}
              aria-label={t("forms.close", "Fermer")}
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="p-3 my-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("admin.contrats.col_type", "Type de contrat *")}
                  </label>
                  <select 
                    value={formData.type_contrat} 
                    onChange={e => setFormData({ ...formData, type_contrat: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="LOCATION">{t("types.location", "Bail de Location")}</option>
                    <option value="ACHAT">{t("types.sale", "Contrat d'Achat (Vente)")}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("admin.contrats.col_property", "Bien concerné *")}
                  </label>
                  <select 
                    required 
                    value={formData.bien} 
                    onChange={e => handleBienChange(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">{t("forms.select_property", "-- Sélectionner un bien --")}</option>
                    {disponiblesBiens.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.titre} - {b.adresse} ({b.mode_transaction})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("admin.contrats.col_tenant", "Client / Locataire / Acquéreur *")}
                </label>
                <select 
                  required 
                  value={formData.locataire} 
                  onChange={e => setFormData({ ...formData, locataire: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">{t("forms.select_client", "-- Sélectionner un client --")}</option>
                  {locataires.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.user?.nom} {l.user?.prenoms} ({l.user?.email})
                    </option>
                  ))}
                </select>
              </div>

              {formData.type_contrat === 'LOCATION' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        {t("admin.contrats.deposit", "Dépôt de garantie")}
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={formData.depot_garantie} 
                        onChange={e => setFormData({ ...formData, depot_garantie: e.target.value })} 
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("admin.contrats.start_date", "Date de début *")}
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
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 flex items-center justify-end gap-3 shrink-0">
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

  // ─────────────────────────────────────────────────────────────
  // 2. CAS AGENT (PAGE COMPLÈTE)
  // ─────────────────────────────────────────────────────────────
  const { initialData, onSubmit = () => {}, onCancel = () => {}, isSubmitting = false, title = "Contrat" } = props
  const [form, setForm] = useState<CreerContratPayload>({ ...emptyForm, ...initialData })
  const [biens, setBiens] = useState<BienListItem[]>([])
  const [locataires, setLocataires] = useState<Locataire[]>([])
  const [loadingContext, setLoadingContext] = useState(true)

  useEffect(() => {
    Promise.all([getBiensDisponibles(), getLocataires()])
      .then(([b, l]) => {
        setBiens(b)
        setLocataires(l)
        setForm(prev => {
          let next = { ...prev }
          if (!initialData?.bien && b.length > 0) {
            next.bien = b[0].id
          }
          if (!initialData?.locataire && l.length > 0) {
            next.locataire = l[0].id
          }

          const selectedBien = b.find(bien => bien.id === next.bien)
          if (selectedBien) {
            if (next.type_contrat === 'ACHAT' && !initialData?.prix) {
              next.prix = selectedBien.prix || ''
            } else if (next.type_contrat === 'LOCATION' && !initialData?.loyer) {
              next.loyer = selectedBien.loyer_mensuel || ''
              const loyerVal = parseFloat(next.loyer)
              if (!isNaN(loyerVal)) {
                next.depot_garantie = (loyerVal * 2).toString()
              }
            }
          }
          return next
        })
      })
      .catch(console.error)
      .finally(() => setLoadingContext(false))
  }, [initialData])

  const handleBienChangeAgent = (bienId: number) => {
    const selected = biens.find(b => b.id === bienId)
    setForm(prev => {
      const next = { ...prev, bien: bienId }
      if (selected) {
        if (selected.mode_transaction === 'VENTE') {
          next.type_contrat = 'ACHAT'
          next.prix = selected.prix || ''
          next.loyer = ''
          next.depot_garantie = ''
        } else {
          next.type_contrat = 'LOCATION'
          next.loyer = selected.loyer_mensuel || ''
          const loyerVal = parseFloat(next.loyer)
          if (!isNaN(loyerVal)) {
            next.depot_garantie = (loyerVal * 2).toString()
          }
          next.prix = ''
        }
      }
      return next
    })
  }

  const handleSubmitAgent = (e: React.FormEvent) => {
    e.preventDefault()
    ;(onSubmit as any)(form)
  }

  if (loadingContext) {
    return <div className="agent-loading">Chargement des données...</div>
  }

  return (
    <div className="agent-card">
      <div className="agent-card-header">
        <h2>{title}</h2>
      </div>

      <form onSubmit={handleSubmitAgent} className="agent-form">
        <div className="form-group">
          <label>Bien immobilier *</label>
          <select 
            value={form.bien} 
            onChange={(e) => handleBienChangeAgent(Number(e.target.value))}
            required
            className="agent-input"
          >
            {biens.map(b => (
              <option key={b.id} value={b.id}>
                {b.titre} - {b.adresse} ({b.mode_transaction})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Locataire / Acheteur *</label>
          <select 
            value={form.locataire} 
            onChange={(e) => setForm({ ...form, locataire: Number(e.target.value) })}
            required
            className="agent-input"
          >
            {locataires.map(l => (
              <option key={l.id} value={l.id}>
                {l.user.nom} {l.user.prenoms} ({l.user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type de contrat</label>
            <input 
              type="text" 
              value={form.type_contrat} 
              disabled 
              className="agent-input agent-input-disabled"
            />
          </div>

          <div className="form-group">
            <label>Date de début *</label>
            <input 
              type="date" 
              value={form.date_debut || ''} 
              onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
              required
              className="agent-input"
            />
          </div>

          {form.type_contrat === 'LOCATION' && (
            <div className="form-group">
              <label>Date de fin</label>
              <input 
                type="date" 
                value={form.date_fin || ''} 
                onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                className="agent-input"
              />
            </div>
          )}
        </div>

        {form.type_contrat === 'LOCATION' ? (
          <div className="form-row">
            <div className="form-group">
              <label>Loyer mensuel (Ar) *</label>
              <input 
                type="number" 
                value={form.loyer || ''} 
                onChange={(e) => setForm({ ...form, loyer: e.target.value })}
                required
                className="agent-input"
              />
            </div>

            <div className="form-group">
              <label>Dépôt de garantie (Ar)</label>
              <input 
                type="number" 
                value={form.depot_garantie || ''} 
                onChange={(e) => setForm({ ...form, depot_garantie: e.target.value })}
                className="agent-input"
              />
            </div>
          </div>
        ) : (
          <div className="form-row">
            <div className="form-group">
              <label>Prix de vente total (Ar) *</label>
              <input 
                type="number" 
                value={form.prix || ''} 
                onChange={(e) => setForm({ ...form, prix: e.target.value })}
                required
                className="agent-input"
              />
            </div>

            <div className="form-group">
              <label>Paiement achat</label>
              <select 
                value={form.type_paiement_achat || 'TOTALITE'} 
                onChange={(e) => setForm({ ...form, type_paiement_achat: e.target.value as any })}
                className="agent-input"
              >
                <option value="TOTALITE">Comptant (Totalité)</option>
                <option value="PARTIEL">Partiel / Échelonné</option>
              </select>
            </div>
          </div>
        )}

        <div className="agent-modal-actions">
          <button type="button" className="agent-btn agent-btn-ghost" onClick={onCancel}>
            <X size={15} /> Annuler
          </button>
          <button type="submit" className="agent-btn agent-btn-primary" disabled={isSubmitting}>
            <Check size={16} />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ContratForm
