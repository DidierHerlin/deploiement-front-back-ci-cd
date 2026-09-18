import { FormEvent } from "react"
import { ArrowRight } from "lucide-react"
import { PasswordInput } from "@/components/ui/password-input"

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
  return (
    <>
      <div className="mb-8 text-center">
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Étape 3 / 3
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-card-foreground">
          Nouveau mot de passe
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choisissez un nouveau mot de passe sécurisé.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="new-password" className="text-sm font-medium text-card-foreground">
            Nouveau mot de passe
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
          <label htmlFor="confirm-new-password" className="text-sm font-medium text-card-foreground">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <PasswordInput
              required
              id="confirm-new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre mot de passe"
            />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </form>
    </>
  )
}
