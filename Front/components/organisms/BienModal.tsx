import { X, Building2, Pencil } from 'lucide-react'
import { Bien, resolveMediaUrl } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type BienModalProps = {
  bien: Bien
  onClose: () => void
  onEdit: () => void
}

export function BienModal({ bien, onClose, onEdit }: BienModalProps) {
  const { t } = useTranslation()

  const getPrixLoyer = () => {
    if (bien.mode_transaction === 'VENTE') {
      return bien.prix ? `${Number(bien.prix).toLocaleString('fr-FR')} Ar` : 'N/A'
    } else {
      return bien.loyer_mensuel ? `${Number(bien.loyer_mensuel).toLocaleString('fr-FR')} Ar ${t("card.per_month", "/ mois")}` : 'N/A'
    }
  }

  const formatType = (type: string) => {
    switch(type) {
      case 'APPARTEMENT': return t("types.apartment", 'Appartement')
      case 'MAISON': return t("types.house", 'Maison')
      case 'LOCAL_COMMERCIAL': return t("types.commercial", 'Local commercial')
      case 'TERRAIN': return t("types.land", 'Terrain')
      default: return type
    }
  }

  const formatStatut = (statut: string) => {
    switch(statut) {
      case 'DISPONIBLE': return t("dashboard.common.status_disponible", 'Disponible')
      case 'RESERVE': return t("dashboard.common.status_reserve", 'Réservé')
      case 'LOUE': return t("dashboard.common.status_loue", 'Loué')
      case 'VENDU': return t("dashboard.common.status_vendu", 'Vendu')
      case 'EN_TRAVAUX': return t("dashboard.common.status_en_travaux", 'En travaux')
      default: return statut
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" style={{ width: '90vw', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <button className="modal-close" onClick={onClose} aria-label={t("forms.close", "Fermer")} style={{ top: '20px', right: '20px' }}><X size={18} /></button>
        
        <div style={{ flexShrink: 0 }}>
          <div className="modal-icon"><Building2 size={20} /></div>
          <h2 id="detail-title">{t("admin.biens.details_title", "Détails du bien")}</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', marginTop: '20px' }}>
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <small style={{ color: '#586577' }}>{t("forms.property_title", "Titre")}</small>
              <p style={{ fontWeight: 500 }}>{bien.titre}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>{t("admin.biens.col_owner", "Propriétaire")}</small>
              <p style={{ fontWeight: 500 }}>{bien.proprietaire?.user?.prenoms} {bien.proprietaire?.user?.nom}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>{t("admin.biens.type_operation", "Type / Opération")}</small>
              <p style={{ fontWeight: 500 }}>{formatType(bien.type)} • {bien.mode_transaction === 'VENTE' ? t("card.for_sale", 'Vente') : t("card.for_rent", 'Location')}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>{t("forms.status", "Statut")}</small>
              <p style={{ fontWeight: 500 }}>{formatStatut(bien.statut)}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <small style={{ color: '#586577' }}>{t("forms.address", "Adresse")}</small>
              <p style={{ fontWeight: 500 }}>{bien.adresse}</p>
            </div>
            <div>
              <small style={{ color: '#586577' }}>{t("forms.surface", "Surface")}</small>
              <p style={{ fontWeight: 500 }}>{bien.surface} m²</p>
            </div>
            {bien.type !== 'TERRAIN' && (
              <div>
                <small style={{ color: '#586577' }}>{t("forms.rooms_count", "Nombre de pièces")}</small>
                <p style={{ fontWeight: 500 }}>{bien.nombre_pieces}</p>
              </div>
            )}
            <div>
              <small style={{ color: '#586577' }}>{bien.mode_transaction === 'VENTE' ? t("card.sale_price", 'Prix') : t("card.monthly_rent", 'Loyer')}</small>
              <p style={{ fontWeight: 500 }}>{getPrixLoyer()}</p>
            </div>
          </div>

          {bien.photos && bien.photos.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <small style={{ color: '#586577', marginBottom: '10px', display: 'block' }}>{t("forms.property_photos", "Photos")} ({bien.photos.length})</small>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                {bien.photos.map((photoUrl, idx) => {
                  const resolvedUrl = resolveMediaUrl(photoUrl) || photoUrl
                  return (
                    <a key={idx} href={resolvedUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', flexShrink: 0 }}>
                      <img 
                        src={resolvedUrl} 
                        alt={`Photo ${idx + 1} de ${bien.titre}`} 
                        style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} 
                        onError={(e) => {
                          if (photoUrl && e.currentTarget.src !== photoUrl) {
                            e.currentTarget.src = photoUrl
                          }
                        }}
                      />
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ flexShrink: 0, marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
          <button type="button" className="outline-button" onClick={onClose}>{t("forms.close", "Fermer")}</button>
          <button type="button" className="primary-button" onClick={onEdit}><Pencil size={15} /> {t("forms.edit", "Modifier")}</button>
        </div>
      </section>
    </div>
  )
}
