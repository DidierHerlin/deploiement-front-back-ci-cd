import { Eye, Pencil, UserMinus } from 'lucide-react'
import { Locataire } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'

type LocataireTableRowProps = {
  locataire: Locataire
  contratsCount: number
  biensCount: number
  onView: (loc: Locataire) => void
  onEdit: (loc: Locataire) => void
  onDisable: (loc: Locataire) => void
}

export function LocataireTableRow({ locataire, contratsCount, biensCount, onView, onEdit, onDisable }: LocataireTableRowProps) {
  const { t } = useTranslation()
  const user = locataire.user
  const isActive = user?.is_active ?? true

  return (
    <tr>
      <td>#{locataire.id}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="user-initial blue">{user?.prenoms?.[0] || '?'}{user?.nom?.[0] || '?'}</div>
          <div>
            <strong>{user?.prenoms} {user?.nom}</strong>
          </div>
        </div>
      </td>
      <td><small style={{ color: '#586577' }}>{user?.email}</small></td>
      <td>{user?.telephone || <span style={{ color: '#ccc' }}>-</span>}</td>
      <td><span className="role-badge">{contratsCount}</span></td>
      <td><span className="role-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>{biensCount}</span></td>
      <td>
        {isActive ? (
          <span className="status paid"><i />{t("dashboard.common.active", "Actif")}</span>
        ) : (
          <span className="status disabled"><i />{t("dashboard.common.inactive", "Désactivé")}</span>
        )}
      </td>
      <td>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button aria-label={t("forms.view", "Voir")} onClick={() => onView(locataire)} title={t("forms.view", "Détails")}><Eye size={15} /></button>
          <button aria-label={t("forms.edit", "Modifier")} onClick={() => onEdit(locataire)} title={t("forms.edit", "Modifier")}><Pencil size={15} /></button>
          {isActive && (
            <button aria-label={t("admin.users.deactivate", "Désactiver")} onClick={() => onDisable(locataire)} title={t("admin.users.deactivate", "Désactiver")} style={{ color: '#ef6a76' }}>
              <UserMinus size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
