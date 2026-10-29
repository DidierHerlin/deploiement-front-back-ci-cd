import { FormEvent } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface ForgotPasswordFormProps {
  email: string
  setEmail: (val: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  error: string
}

export function ForgotPasswordForm({ email, setEmail, onSubmit, isLoading, error }: ForgotPasswordFormProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
          {t("auth.forgot_password.instruction_step1", "ÉTAPE 1 SUR 3 • IDENTIFICATION")}
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t("auth.forgot_password.title_step1", "Mot de passe oublié ?")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t("auth.forgot_password.subtitle_step1", "Saisissez votre adresse email pour recevoir un code de réinitialisation sécurisé.")}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="recovery-email" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 block">
            {t("auth.login.email_label", "Email")}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            <input
              required
              id="recovery-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.forgot_password.email_placeholder", "vous@exemple.com")}
              className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-11 pr-4 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 px-4 py-3 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 cursor-pointer"
        >
          {isLoading ? t("auth.forgot_password.sending_code", "Envoi en cours...") : t("auth.forgot_password.btn_send_code", "Recevoir le code")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </form>
    </>
  )
}
