import { FormEvent } from "react"
import { ArrowRight, ShieldCheck } from "lucide-react"

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
  return (
    <>
      <div className="mb-8 text-center">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Étape 2 / 3
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-card-foreground">
          Vérification du code
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Saisissez le code à 6 chiffres envoyé à <strong>{email}</strong>.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="reset-code" className="text-sm font-medium text-card-foreground">
            Code de vérification
          </label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              required
              id="reset-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-center text-lg font-mono tracking-[0.5em] outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/15"
            />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || code.length < 6}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Vérification..." : "Vérifier le code"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onResend}
          className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Renvoyer un code
        </button>
      </form>
    </>
  )
}
