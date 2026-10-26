import { useTranslation } from '@/lib/i18n'

export function BienTableHeader() {
  const { t } = useTranslation()
  return (
    <thead>
      <tr>
        <th>{t("admin.biens.col_id", "ID")}</th>
        <th>{t("admin.biens.col_title_address", "TITRE / ADRESSE")}</th>
        <th>{t("admin.biens.col_type", "TYPE")}</th>
        <th>{t("admin.biens.col_surface", "SURFACE")}</th>
        <th>{t("admin.biens.col_owner", "PROPRIÉTAIRE")}</th>
        <th>{t("admin.biens.col_operation", "OPÉRATION")}</th>
        <th>{t("admin.biens.col_price_rent", "PRIX / LOYER")}</th>
        <th>{t("admin.biens.col_status", "STATUT")}</th>
        <th style={{ textAlign: 'right' }}>{t("admin.biens.col_actions", "ACTIONS")}</th>
      </tr>
    </thead>
  )
}
