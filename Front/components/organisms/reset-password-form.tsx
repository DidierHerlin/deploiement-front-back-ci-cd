import { FormEvent } from "react"
import { ArrowRight } from "lucide-react"
import { PasswordInput } from "@/components/atoms/password-input"
import { useTranslation } from "@/lib/i18n"

interface ResetPasswordFormProps {
  newPassword: string
  setNewPassword: (val: string) => void
  confirmPassword: string
  setConfirmPassword: (val: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  error: string
}

export function ResetPasswordForm({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  isLoading,
  error
}: ResetPasswordFormProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
          {t("auth.forgot_password.instruction_step3", "ÉTAPE 3 SUR 3 • NOUVEAU MOT DE PASSE")}
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t("auth.forgot_password.title_step3", "Nouveau mot de passe")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t("auth.forgot_password.subtitle_step3", "Choisissez un nouveau mot de passe sécurisé.")}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="new-password" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 block">
            {t("auth.forgot_password.new_password_label", "Nouveau mot de passe")}
          </label>
          <div className="relative">
            <PasswordInput
              required
              id="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8 caractères minimum"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="confirm-new-password" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 block">
            {t("auth.forgot_password.confirm_password_label", "Confirmer le mot de passe")}
          </label>
          <div className="relative">
            <PasswordInput
              required
              id="confirm-new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="8 caractères minimum"
            />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 px-4 py-3 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 cursor-pointer"
        >
          {isLoading ? t("auth.forgot_password.resetting", "Mise à jour du mot de passe...") : t("auth.forgot_password.btn_reset", "Réinitialiser le mot de passe")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </form>
    </>
  )
}
