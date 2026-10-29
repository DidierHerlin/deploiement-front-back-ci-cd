import { FormEvent } from "react"
import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface VerifyCodeFormProps {
  email: string
  code: string
  setCode: (val: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onResend: () => void
  isLoading: boolean
  error: string
}

export function VerifyCodeForm({ email, code, setCode, onSubmit, onResend, isLoading, error }: VerifyCodeFormProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
          {t("auth.forgot_password.instruction_step2", "ÉTAPE 2 SUR 3 • CODE DE VÉRIFICATION")}
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t("auth.forgot_password.title_step2", "Vérification du code")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t("auth.forgot_password.subtitle_step2", "Saisissez le code à 6 chiffres envoyé à votre adresse email.")}
        </p>
      </div>

      <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>Code de sécurité envoyé à <strong className="font-semibold text-emerald-900 dark:text-emerald-300">{email}</strong></span>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="reset-code" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 block">
            {t("auth.forgot_password.code_label", "Code de vérification")}
          </label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            <input
              required
              id="reset-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={t("auth.forgot_password.code_placeholder", "000000")}
              className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-11 pr-4 text-center text-lg font-mono tracking-[0.5em] text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 px-4 py-3 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || code.length < 6}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 cursor-pointer"
        >
          {isLoading ? t("auth.forgot_password.verifying_code", "Vérification...") : t("auth.forgot_password.btn_verify_code", "Vérifier le code")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onResend}
          className="w-full text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          ← {t("auth.forgot_password.btn_back", "Retour")}
        </button>
      </form>
    </>
  )
}
