import { X, Building2, Pencil } from 'lucide-react'
import { Bien } from '@/lib/api'

type BienModalProps = {
  bien: Bien
  onClose: () => void
  onEdit: () => void
}

export function BienModal({ bien, onClose, onEdit }: BienModalProps) {
  const getPrixLoyer = () => {
    if (bien.mode_transaction === 'VENTE') {
      return bien.prix ? `${Number(bien.prix).toLocaleString('fr-FR')} Ar` : 'N/A'
    } else {
      return bien.loyer_mensuel ? `${Number(bien.loyer_mensuel).toLocaleString('fr-FR')} Ar / mois` : 'N/A'
    }
  }

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'LOCAL_COMMERCIAL': 'Local commercial',
      'TERRAIN': 'Terrain'
    }
    return map[type] || type
  }

  const formatStatut = (statut: string) => {
    const map: Record<string, string> = {
      'DISPONIBLE': 'Disponible',
      'RESERVE': 'Réservé',
      'LOUE': 'Loué',
      'VENDU': 'Vendu',
      'EN_TRAVAUX': 'En travaux'
    }
    return map[statut] || statut
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" style={{ width: '90vw', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer" style={{ top: '20px', right: '20px' }}><X size={18} /></button>
        
        <div style={{ flexShrink: 0 }}>
          <div className="modal-icon"><Building2 size={20} /></div>
          <h2 id="detail-title">Détails du bien</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', marginTop: '20px' }}>
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <small style={{ color: '#586577' }}>Titre</small>
              <p style={{ fontWeight: 500 }}>{bien.titre}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>Propriétaire</small>
              <p style={{ fontWeight: 500 }}>{bien.proprietaire?.user?.prenoms} {bien.proprietaire?.user?.nom}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>Type / Opération</small>
              <p style={{ fontWeight: 500 }}>{formatType(bien.type)} • {bien.mode_transaction === 'VENTE' ? 'Vente' : 'Location'}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>Statut</small>
              <p style={{ fontWeight: 500 }}>{formatStatut(bien.statut)}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <small style={{ color: '#586577' }}>Adresse</small>
              <p style={{ fontWeight: 500 }}>{bien.adresse}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>Surface</small>
              <p style={{ fontWeight: 500 }}>{bien.surface} m²</p>
            </div>
            {bien.type !== 'TERRAIN' && (
              <div>
                <small style={{ color: '#586577' }}>Nombre de pièces</small>
                <p style={{ fontWeight: 500 }}>{bien.nombre_pieces}</p>
              </div>
            )}
            <div>
              <small style={{ color: '#586577' }}>{bien.mode_transaction === 'VENTE' ? 'Prix' : 'Loyer'}</small>
              <p style={{ fontWeight: 500 }}>{getPrixLoyer()}</p>
            </div>
          </div>

          {bien.photos && bien.photos.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <small style={{ color: '#586577', marginBottom: '10px', display: 'block' }}>Photos ({bien.photos.length})</small>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                {bien.photos.map((photoUrl, idx) => (
                  <a key={idx} href={photoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', flexShrink: 0 }}>
                    <img 
                      src={photoUrl} 
                      alt={`Photo ${idx + 1} de ${bien.titre}`} 
                      style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} 
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ flexShrink: 0, marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
          <button className="outline-button" onClick={onClose}>Fermer</button>
          <button className="primary-button" onClick={onEdit}><Pencil size={15} /> Modifier</button>
        </div>
      </section>
    </div>
  )
}
