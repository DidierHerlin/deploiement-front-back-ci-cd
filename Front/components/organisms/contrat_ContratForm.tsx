import { X, FileText } from 'lucide-react'
import { Contrat, Bien, Locataire, getBienInfo } from '@/lib/api'
import { useState, useEffect } from 'react'

type ContratFormProps = {
  editingContrat: Contrat | null
  disponiblesBiens: Bien[]
  locataires: Locataire[]
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
}

export function ContratForm({ editingContrat, disponiblesBiens, locataires, onClose, onSubmit }: ContratFormProps) {
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
    
    // En modification, la plupart des champs (bien, locataire, type) sont ignorés ou read_only côté backend,
    // mais on envoie quand même la donnée formatée.
    
    try {
      await onSubmit(payload)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const isLocation = formData.type_contrat === 'LOCATION'

  return (
    <div className="modal-backdrop" role="presentation" style={{ zIndex: 1100 }}>
      <section className="modal" role="dialog" aria-modal="true" style={{ width: '90vw', maxWidth: '1300px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer" style={{ top: '20px', right: '20px' }}><X size={18} /></button>
        
        <div style={{ flexShrink: 0, marginBottom: '20px' }}>
          <div className="modal-icon"><FileText size={20} /></div>
          <h2>{editingContrat ? 'Modifier le contrat' : 'Nouveau Contrat'}</h2>
          
          {error && (
            <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginTop: '15px', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignContent: 'start' }}>
            
            <label style={{ minWidth: 0 }}>Locataire / Acheteur *
              <select required value={formData.locataire} onChange={e => setFormData({ ...formData, locataire: e.target.value })} disabled={!!editingContrat} style={{ width: '100%', textOverflow: 'ellipsis' }}>
                <option value="">-- Sélectionner --</option>
                {locataires.map(l => (
                  <option key={l.id} value={l.id}>{l.user?.prenoms} {l.user?.nom}</option>
                ))}
              </select>
            </label>

            <label style={{ minWidth: 0 }}>Bien immobilier *
              <select required value={formData.bien} onChange={e => handleBienChange(e.target.value)} disabled={!!editingContrat} style={{ width: '100%', textOverflow: 'ellipsis' }}>
                <option value="">-- Sélectionner --</option>
                {editingContrat && <option value={editingContrat.bien}>{editingContrat.bien_titre}</option>}
                {disponiblesBiens.map(b => (
                  <option key={b.id} value={b.id}>{b.titre} ({b.mode_transaction})</option>
                ))}
              </select>
            </label>

            <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
              <label style={{ width: '100%', maxWidth: '300px', minWidth: 0 }}>Type de contrat *
                <select required value={formData.type_contrat} onChange={e => setFormData({ ...formData, type_contrat: e.target.value })} disabled style={{ width: '100%', textOverflow: 'ellipsis' }}>
                  <option value="LOCATION">Location</option>
                  <option value="ACHAT">Achat</option>
                </select>
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  Le type est déterminé automatiquement en fonction du bien sélectionné.
                </small>
              </label>
            </div>

            {isLocation ? (
              <>
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <h3 style={{ fontSize: '14px', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Conditions financières (Location)</h3>
                </div>
                
                <label>Loyer mensuel *
                  <input type="number" step="0.01" required value={formData.loyer} onChange={e => setFormData({ ...formData, loyer: e.target.value })} />
                </label>
                <label>Dépôt de garantie *
                  <input type="number" step="0.01" required value={formData.depot_garantie} onChange={e => setFormData({ ...formData, depot_garantie: e.target.value })} />
                </label>

                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <h3 style={{ fontSize: '14px', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Période</h3>
                </div>

                <label>Date de début *
                  <input type="date" required value={formData.date_debut} onChange={e => setFormData({ ...formData, date_debut: e.target.value })} />
                </label>
                <label>Date de fin
                  <input type="date" value={formData.date_fin} onChange={e => setFormData({ ...formData, date_fin: e.target.value })} />
                </label>
              </>
            ) : (
              <>
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <h3 style={{ fontSize: '14px', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Conditions financières (Achat)</h3>
                </div>

                <label>Prix de vente *
                  <input type="number" step="0.01" required value={formData.prix} onChange={e => setFormData({ ...formData, prix: e.target.value })} />
                </label>
                <label>Modalité de paiement *
                  <select required value={formData.type_paiement_achat} onChange={e => setFormData({ ...formData, type_paiement_achat: e.target.value })}>
                    <option value="TOTALITE">Comptant (100%)</option>
                    <option value="PARTIEL">Échelonné (50% puis mensualités)</option>
                  </select>
                </label>
              </>
            )}

          </div>

          <div className="modal-actions" style={{ flexShrink: 0, marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="outline-button" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
