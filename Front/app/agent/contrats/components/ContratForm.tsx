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
        // Auto-select first item if new form
        setForm(prev => {
          let next = { ...prev }
          if (!initialData?.bien && b.length > 0) {
            next.bien = b[0].id
          }
          if (!initialData?.locataire && l.length > 0) {
            next.locataire = l[0].id
          }
          
          // Auto-calculate financial fields
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

  if (loadingContext) return <div className="p-8 text-center text-gray-500">Chargement du formulaire...</div>

  return (
    <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="modal-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="section-kicker">CONTRATS</p>
          <h2 id="form-title" style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Renseignez les informations du contrat.</p>
        </div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
            Type de contrat
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
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)' }}
            >
              <option value="LOCATION">Location</option>
              <option value="ACHAT">Achat/Vente</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
            Bien
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
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)' }}
            >
              <option value={0} disabled>Sélectionner un bien</option>
              {biens.map(b => (
                <option key={b.id} value={b.id}>{b.titre} - {b.adresse}</option>
              ))}
              {/* Fallback in case of edit where the 'bien' is not in available list anymore */}
              {initialData?.bien && !biens.find(b => b.id === initialData.bien) && (
                <option value={initialData.bien}>Bien #{initialData.bien} (Actuel)</option>
              )}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
            Locataire
            <select 
              value={form.locataire} 
              onChange={(e) => update('locataire', Number(e.target.value))}
              required
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)' }}
            >
              <option value={0} disabled>Sélectionner un locataire</option>
              {locataires.map(l => (
                <option key={l.id} value={l.id}>{l.user.prenoms} {l.user.nom}</option>
              ))}
            </select>
          </label>

          {form.type_contrat === "ACHAT" && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
              Type de paiement
              <select 
                value={form.type_paiement_achat || 'TOTALITE'} 
                onChange={(e) => update('type_paiement_achat', e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)' }}
              >
                <option value="TOTALITE">Totalité (Comptant - 100%)</option>
                <option value="PARTIEL">Partiel (50% puis 5x10%)</option>
              </select>
            </label>
          )}

          {form.type_contrat === "LOCATION" && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
              Date de début
              <input 
                type="date" 
                required 
                value={form.date_debut || ''} 
                onChange={(e) => update('date_debut', e.target.value)} 
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)' }}
              />
            </label>
          )}

          {form.type_contrat === "LOCATION" && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
              Date de fin (optionnelle)
              <input 
                type="date" 
                value={form.date_fin || ''} 
                onChange={(e) => update('date_fin', e.target.value)} 
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)' }}
              />
            </label>
          )}

          {form.type_contrat === "LOCATION" && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
              Loyer mensuel (Ar)
              <input 
                type="number" 
                min="0" 
                value={form.loyer || ''} 
                onChange={(e) => update('loyer', e.target.value)} 
                readOnly
                placeholder="Ex. 850000"
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--muted)', cursor: 'not-allowed', color: 'var(--muted-foreground)' }}
                title="Le loyer est automatiquement récupéré à partir du bien sélectionné."
              />
            </label>
          )}

          {form.type_contrat === "LOCATION" && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
              Dépôt de garantie (Ar)
              <input 
                type="number" 
                min="0" 
                value={form.depot_garantie || ''} 
                onChange={(e) => update('depot_garantie', e.target.value)} 
                readOnly
                placeholder="Ex. 1700000"
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--muted)', cursor: 'not-allowed', color: 'var(--muted-foreground)' }}
                title="Le dépôt de garantie est calculé automatiquement (Loyer x 2)."
              />
            </label>
          )}

          {form.type_contrat === "ACHAT" && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
              Prix de vente (Ar)
              <input 
                type="number" 
                min="0" 
                value={form.prix || ''} 
                onChange={(e) => update('prix', e.target.value)} 
                readOnly
                placeholder="Ex. 250000000"
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--muted)', cursor: 'not-allowed', color: 'var(--muted-foreground)' }}
                title="Le prix est automatiquement récupéré à partir du bien sélectionné."
              />
            </label>
          )}

        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
          <button 
            type="button" 
            onClick={onCancel}
            style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 500 }}
          >
            <Check size={16} /> 
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
