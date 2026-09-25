import { FormEvent } from "react"
import { ArrowRight, Mail } from "lucide-react"

interface ForgotPasswordFormProps {
  email: string
  setEmail: (val: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  error: string
}

export function ForgotPasswordForm({ email, setEmail, onSubmit, isLoading, error }: ForgotPasswordFormProps) {
  return (
    <>
      <div className="mb-8 text-center">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Étape 1 / 3
        </p>
        <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
          Mot de passe oublié ?
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Saisissez votre email pour recevoir un code de réinitialisation.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="recovery-email" className="text-sm font-medium text-foreground">
            Adresse email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              required
              id="recovery-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="h-12 w-full rounded-xl border border-input/60 bg-muted/40 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground shadow-sm hover:border-primary/40 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive backdrop-blur-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
        >
          {isLoading ? "Envoi en cours..." : "Recevoir le code"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </form>
    </>
  )
}
