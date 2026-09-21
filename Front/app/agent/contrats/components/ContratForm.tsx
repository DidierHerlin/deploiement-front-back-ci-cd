"use client"

import { useState, useEffect } from "react"
import { Check, X } from "lucide-react"
import { getBiensDisponibles, getLocataires, BienListItem, Locataire, CreerContratPayload } from "@/lib/api"

interface ContratFormProps {
  initialData?: Partial<CreerContratPayload>
  onSubmit: (data: CreerContratPayload) => void
  onCancel: () => void
  isSubmitting?: boolean
  title: string
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

export default function ContratForm({ initialData, onSubmit, onCancel, isSubmitting, title }: ContratFormProps) {
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

  const update = (key: keyof CreerContratPayload, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  if (loadingContext) return <div className="agent-loading">Chargement du formulaire...</div>

  return (
    <div className="panel" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="agent-panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        <p className="eyebrow">CONTRATS</p>
        <h2 style={{ fontSize: 20, fontWeight: 750, margin: '4px 0' }}>{title}</h2>
        <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', margin: 0 }}>Renseignez les informations du contrat.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}>
        <div className="agent-form-grid">
          <label className="agent-field">Type de contrat
            <select
              value={form.type_contrat}
              onChange={(e) => {
                const type = e.target.value as "LOCATION" | "ACHAT"
                setForm(prev => {
                  const next = { ...prev, type_contrat: type }
                  const selectedBien = biens.find(b => b.id === prev.bien)
                  if (selectedBien) {
                    if (type === 'ACHAT') {
                      next.prix = selectedBien.prix || ''
                      next.loyer = ''
                      next.depot_garantie = ''
                    } else if (type === 'LOCATION') {
                      next.loyer = selectedBien.loyer_mensuel || ''
                      const loyerVal = parseFloat(next.loyer)
                      if (!isNaN(loyerVal)) {
                        next.depot_garantie = (loyerVal * 2).toString()
                      } else {
                        next.depot_garantie = ''
                      }
                      next.prix = ''
                    }
                  }
                  return next
                })
              }}
            >
              <option value="LOCATION">Location</option>
              <option value="ACHAT">Achat/Vente</option>
            </select>
          </label>

          <label className="agent-field">Bien
            <select
              value={form.bien}
              onChange={(e) => {
                const bienId = Number(e.target.value)
                setForm(prev => {
                  const next = { ...prev, bien: bienId }
                  const selectedBien = biens.find(b => b.id === bienId)
                  if (selectedBien) {
                    if (prev.type_contrat === 'ACHAT') {
                      next.prix = selectedBien.prix || ''
                    } else if (prev.type_contrat === 'LOCATION') {
                      next.loyer = selectedBien.loyer_mensuel || ''
                      const loyerVal = parseFloat(next.loyer)
                      if (!isNaN(loyerVal)) {
                        next.depot_garantie = (loyerVal * 2).toString()
                      } else {
                        next.depot_garantie = ''
                      }
                    }
                  }
                  return next
                })
              }}
              required
            >
              <option value={0} disabled>Sélectionner un bien</option>
              {biens.map(b => (
                <option key={b.id} value={b.id}>{b.titre} - {b.adresse}</option>
              ))}
              {initialData?.bien && !biens.find(b => b.id === initialData.bien) && (
                <option value={initialData.bien}>Bien #{initialData.bien} (Actuel)</option>
              )}
            </select>
          </label>

          <label className="agent-field">Locataire
            <select
              value={form.locataire}
              onChange={(e) => update('locataire', Number(e.target.value))}
              required
            >
              <option value={0} disabled>Sélectionner un locataire</option>
              {locataires.map(l => (
                <option key={l.id} value={l.id}>{l.user.prenoms} {l.user.nom}</option>
              ))}
            </select>
          </label>

          {form.type_contrat === "ACHAT" && (
            <label className="agent-field">Type de paiement
              <select
                value={form.type_paiement_achat || 'TOTALITE'}
                onChange={(e) => update('type_paiement_achat', e.target.value)}
              >
                <option value="TOTALITE">Totalité (Comptant - 100%)</option>
                <option value="PARTIEL">Partiel (50% puis 5x10%)</option>
              </select>
            </label>
          )}

          {form.type_contrat === "LOCATION" && (
            <label className="agent-field">Date de début
              <input
                type="date"
                required
                value={form.date_debut || ''}
                onChange={(e) => update('date_debut', e.target.value)}
              />
            </label>
          )}

          {form.type_contrat === "LOCATION" && (
            <label className="agent-field">Date de fin (optionnelle)
              <input
                type="date"
                value={form.date_fin || ''}
                onChange={(e) => update('date_fin', e.target.value)}
              />
            </label>
          )}

          {form.type_contrat === "LOCATION" && (
            <label className="agent-field">Loyer mensuel (Ar)
              <input
                type="number"
                min="0"
                value={form.loyer || ''}
                onChange={(e) => update('loyer', e.target.value)}
                readOnly
                placeholder="Ex. 850000"
                title="Le loyer est automatiquement récupéré à partir du bien sélectionné."
              />
              <span className="hint">Récupéré automatiquement depuis le bien.</span>
            </label>
          )}

          {form.type_contrat === "LOCATION" && (
            <label className="agent-field">Dépôt de garantie (Ar)
              <input
                type="number"
                min="0"
                value={form.depot_garantie || ''}
                onChange={(e) => update('depot_garantie', e.target.value)}
                readOnly
                placeholder="Ex. 1700000"
                title="Le dépôt de garantie est calculé automatiquement (Loyer x 2)."
              />
              <span className="hint">Calculé automatiquement (loyer × 2).</span>
            </label>
          )}

          {form.type_contrat === "ACHAT" && (
            <label className="agent-field">Prix de vente (Ar)
              <input
                type="number"
                min="0"
                value={form.prix || ''}
                onChange={(e) => update('prix', e.target.value)}
                readOnly
                placeholder="Ex. 250000000"
                title="Le prix est automatiquement récupéré à partir du bien sélectionné."
              />
              <span className="hint">Récupéré automatiquement depuis le bien.</span>
            </label>
          )}
        </div>

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
