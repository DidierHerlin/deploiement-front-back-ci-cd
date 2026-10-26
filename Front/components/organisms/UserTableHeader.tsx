import { useTranslation } from '@/lib/i18n'

export function UserTableHeader() {
  const { t } = useTranslation()
  return (
    <thead>
      <tr>
        <th>{t("admin.users.col_user", "UTILISATEUR")}</th>
        <th>{t("admin.users.col_contact", "CONTACT")}</th>
        <th>{t("admin.users.col_role", "RÔLE")}</th>
        <th>{t("admin.users.col_status", "STATUT")}</th>
        <th>{t("admin.users.col_created", "CRÉATION")}</th>
        <th style={{ textAlign: 'right' }}>{t("admin.users.col_actions", "ACTIONS")}</th>
      </tr>
    </thead>
  )
}
