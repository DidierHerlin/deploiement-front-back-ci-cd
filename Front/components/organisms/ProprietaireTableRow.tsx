import { Eye, Pencil, UserMinus } from 'lucide-react'
import { Proprietaire } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type ProprietaireTableRowProps = {
  proprietaire: Proprietaire
  biensCount: number
  onView: (prop: Proprietaire) => void
  onEdit: (prop: Proprietaire) => void
  onDisable: (prop: Proprietaire) => void
}

export function ProprietaireTableRow({ proprietaire, biensCount, onView, onEdit, onDisable }: ProprietaireTableRowProps) {
  const { t } = useTranslation()
  const user = proprietaire.user
  const isActive = user?.is_active ?? true // Fallback to true if missing (sometimes serializer omits it)

  return (
    <tr>
      <td>#{proprietaire.id}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="user-initial blue">{user?.prenoms?.[0] || '?'}{user?.nom?.[0] || '?'}</div>
          <div>
            <strong>{user?.prenoms} {user?.nom}</strong>
            <small style={{ display: 'block', color: '#9aa3b0', fontSize: '11px' }}>{user?.email}</small>
          </div>
        </div>
      </td>
      <td>{user?.telephone || <span style={{ color: '#ccc' }}>{t("profile.not_provided", "Non renseigné")}</span>}</td>
      <td>
        <span className="role-badge">{biensCount} {biensCount > 1 ? t("admin.biens.properties", 'biens') : t("admin.biens.property", 'bien')}</span>
      </td>
      <td>
        {isActive ? (
          <span className="status paid"><i />{t("dashboard.common.active", "Actif")}</span>
        ) : (
          <span className="status disabled"><i />{t("dashboard.common.inactive", "Désactivé")}</span>
        )}
      </td>
      <td>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button aria-label={t("forms.view", "Voir")} onClick={() => onView(proprietaire)} title={t("forms.view", "Détails")}><Eye size={15} /></button>
          <button aria-label={t("forms.edit", "Modifier")} onClick={() => onEdit(proprietaire)} title={t("forms.edit", "Modifier")}><Pencil size={15} /></button>
          {isActive && (
            <button aria-label={t("admin.users.deactivate", "Désactiver")} onClick={() => onDisable(proprietaire)} title={t("admin.users.deactivate", "Désactiver")} style={{ color: '#ef6a76' }}>
              <UserMinus size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
