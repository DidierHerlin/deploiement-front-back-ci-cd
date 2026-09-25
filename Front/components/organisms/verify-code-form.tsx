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
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Étape 2 / 3
        </p>
        <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
          Vérification du code
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Saisissez le code à 6 chiffres envoyé à <strong>{email}</strong>.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="reset-code" className="text-sm font-medium text-foreground">
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
              className="h-12 w-full rounded-xl border border-input/60 bg-muted/40 pl-10 pr-4 text-center text-lg font-mono tracking-[0.5em] outline-none transition-all placeholder:text-muted-foreground shadow-sm hover:border-primary/40 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive backdrop-blur-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || code.length < 6}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
        >
          {isLoading ? "Vérification..." : "Vérifier le code"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onResend}
          className="w-full text-center text-sm font-medium text-muted-foreground transition-all hover:text-primary"
        >
          Je n'ai pas reçu le code
        </button>
      </form>
    </>
  )
}
