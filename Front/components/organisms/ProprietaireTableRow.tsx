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
  const isActive = user?.is_active ?? true // Fallback to true if missing
  const iban = proprietaire.iban || (proprietaire as any).rib || (proprietaire as any).contact_paiement

  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
      <td>
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">#{proprietaire.id}</span>
      </td>
      <td>
        <div className="flex items-center gap-2.5">
          <div className="user-initial blue border border-transparent dark:border-slate-700/80 dark:bg-blue-500/15 dark:text-blue-300 shrink-0">
            {user?.prenoms?.[0] || '?'}{user?.nom?.[0] || '?'}
          </div>
          <div>
            <strong className="text-slate-900 dark:text-slate-100 block">{user?.prenoms} {user?.nom}</strong>
            <small className="block text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{user?.email}</small>
          </div>
        </div>
      </td>
      <td>
        <div className="flex flex-col gap-0.5">
          {user?.telephone ? (
            <span className="text-slate-800 dark:text-slate-200 text-xs font-medium">{user.telephone}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-xs italic">{t("profile.not_provided", "Non renseigné")}</span>
          )}
          {iban ? (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{iban}</span>
          ) : (
            <span className="italic text-xs text-slate-400 dark:text-slate-500">{t("profile.iban_not_provided", "IBAN non renseigné")}</span>
          )}
        </div>
      </td>
      <td>
        <span className="role-badge dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700">
          {biensCount} {biensCount > 1 ? t("admin.biens.properties", 'biens') : t("admin.biens.property", 'bien')}
        </span>
      </td>
      <td>
        {isActive ? (
          <span className="status paid dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
            <i className="dark:bg-emerald-400" />
            {t("dashboard.common.active", "Actif")}
          </span>
        ) : (
          <span className="status disabled dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700">
            <i className="dark:bg-slate-500" />
            {t("dashboard.common.inactive", "Désactivé")}
          </span>
        )}
      </td>
      <td>
        <div className="row-actions flex items-center justify-end gap-1">
          <button 
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer" 
            aria-label={t("forms.view", "Voir")} 
            onClick={() => onView(proprietaire)} 
            title={t("forms.view", "Détails")}
          >
            <Eye size={15} />
          </button>
          <button 
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer" 
            aria-label={t("forms.edit", "Modifier")} 
            onClick={() => onEdit(proprietaire)} 
            title={t("forms.edit", "Modifier")}
          >
            <Pencil size={15} />
          </button>
          {isActive && (
            <button 
              className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400/80 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors cursor-pointer" 
              aria-label={t("admin.users.deactivate", "Désactiver")} 
              onClick={() => onDisable(proprietaire)} 
              title={t("admin.users.deactivate", "Désactiver")}
            >
              <UserMinus size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
