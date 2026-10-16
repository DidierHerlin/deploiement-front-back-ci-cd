import { X, Link2 } from 'lucide-react'
import { Bien, Proprietaire } from '@/lib/api'
import { useState } from 'react'

type AssignBienModalProps = {
  targetProprietaire: Proprietaire
  allBiens: Bien[]
  onClose: () => void
  onAssign: (bienId: number) => Promise<void>
}

export function AssignBienModal({ targetProprietaire, allBiens, onClose, onAssign }: AssignBienModalProps) {
  const [selectedBienId, setSelectedBienId] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  
  // Exclure les biens qui appartiennent déjà à ce propriétaire
  const availableBiens = allBiens.filter(b => b.proprietaire?.id !== targetProprietaire.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBienId) return
    setLoading(true)
    try {
      await onAssign(Number(selectedBienId))
    } catch (e: any) {
      alert("Erreur lors de l'association: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedBien = availableBiens.find(b => b.id === Number(selectedBienId))

  return (
    <div className="modal-backdrop" role="presentation" style={{ zIndex: 1100 }}>
      <section className="modal" role="dialog" aria-modal="true" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        <div className="modal-icon"><Link2 size={20} /></div>
        <h2>Associer un bien (Transfert)</h2>
        <p>Règle RG-08 : Un bien immobilier appartient à <strong>un seul propriétaire</strong>. L'association transfèrera la propriété si le bien appartient déjà à quelqu'un d'autre.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <label>Sélectionner un bien
            <select required value={selectedBienId} onChange={e => setSelectedBienId(e.target.value)}>
              <option value="">-- Choisir un bien --</option>
              {availableBiens.map(b => (
                <option key={b.id} value={b.id}>
                  {b.titre} (Propriétaire actuel : {b.proprietaire?.user?.prenoms} {b.proprietaire?.user?.nom})
                </option>
              ))}
            </select>
          </label>
          
          {selectedBien && (
            <div style={{ padding: '10px', background: '#fffbeb', color: '#b45309', borderRadius: '4px', marginTop: '10px', fontSize: '13px' }}>
              <strong>Attention :</strong> Le bien "{selectedBien.titre}" sera retiré à {selectedBien.proprietaire?.user?.prenoms} {selectedBien.proprietaire?.user?.nom} pour être réattribué à {targetProprietaire.user?.prenoms} {targetProprietaire.user?.nom}.
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="outline-button" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" className="primary-button" disabled={loading || !selectedBienId}>
              {loading ? 'Association...' : 'Confirmer le transfert'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
