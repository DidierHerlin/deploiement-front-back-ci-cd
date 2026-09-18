"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, LockKeyhole, Mail, Phone, UserRound, Wallet } from "lucide-react"
import { PasswordInput } from "@/components/ui/password-input"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

type Role = "LOCATAIRE" | "PROPRIETAIRE" | "AGENT"

type ApiErrorDetails = Record<string, string[]>

function messagesDuChamp(details: ApiErrorDetails | undefined, champ: string): string | undefined {
  return details?.[champ]?.[0]
}

export function SignupForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("LOCATAIRE")

  const [email, setEmail] = useState("")
  const [nom, setNom] = useState("")
  const [prenoms, setPrenoms] = useState("")
  const [telephone, setTelephone] = useState("")
  const [iban, setIban] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<ApiErrorDetails>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setFieldErrors({})
    setSuccessMessage("")

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      toast.error("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (role === "PROPRIETAIRE" && iban.trim().length === 0) {
      setError("L'IBAN est requis pour un compte propriétaire.")
      toast.error("L'IBAN est requis pour un compte propriétaire.")
      return
    }

    setIsLoading(true)

    const endpoint =
      role === "LOCATAIRE"
        ? "/locataires/register/"
        : role === "PROPRIETAIRE"
          ? "/proprietaires/register/"
          : "/agents/register/"
    const payload =
      role === "PROPRIETAIRE"
        ? { email, nom, prenoms, telephone, password, iban }
        : { email, nom, prenoms, telephone, password }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        if (data.details && typeof data.details === "object") {
          setFieldErrors(data.details)
        }
        const errorMsg = data.error ?? "Impossible de créer votre compte."
        toast.error(errorMsg)
        throw new Error(errorMsg)
      }

      const successMsg = role === "LOCATAIRE"
        ? "Compte créé avec succès. Vous pouvez vous connecter dès maintenant."
        : role === "PROPRIETAIRE"
          ? "Inscription enregistrée. Votre compte sera activé après validation par un agent."
          : "Inscription enregistrée. Votre compte sera activé après validation par un administrateur."
          
      setSuccessMessage(successMsg)
      toast.success(successMsg)

      setTimeout(() => router.push("/login"), 2000)
    } catch (signupError) {
      const msg = signupError instanceof Error ? signupError.message : "Une erreur est survenue."
      setError(msg)
      if (!msg.includes("Impossible de créer votre compte.")) {
          toast.error(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-lg">
        <Link href="/login" className="mb-8 flex items-center justify-center gap-3" aria-label="Retour à la connexion">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><LockKeyhole className="size-5" aria-hidden="true" /></span>
          <span className="font-sans text-xl font-semibold tracking-tight">Immo<span className="text-primary">Connect</span></span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-7 shadow-[0_20px_70px_-35px_oklch(0.2_0.02_250/0.35)] sm:p-9">
          <div className="mb-8 text-center">
            <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Votre nouvel espace</p>
            <h1 className="font-sans text-3xl font-semibold tracking-tight text-card-foreground">Créer un compte</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Centralisez vos projets immobiliers en toute simplicité.</p>
          </div>

          <RoleToggle role={role} onChange={setRole} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="prenoms" label="Prénom(s)" placeholder="Camille" icon={<UserRound />} value={prenoms} onChange={setPrenoms} error={messagesDuChamp(fieldErrors, "prenoms")} />
              <Field id="nom" label="Nom" placeholder="Martin" icon={<UserRound />} value={nom} onChange={setNom} error={messagesDuChamp(fieldErrors, "nom")} />
            </div>

            <Field id="signup-email" label="Adresse email" type="email" placeholder="vous@exemple.com" icon={<Mail />} value={email} onChange={setEmail} error={messagesDuChamp(fieldErrors, "email")} />

            <Field id="telephone" label="Téléphone (optionnel)" type="tel" placeholder="034 00 000 00" icon={<Phone />} value={telephone} onChange={setTelephone} required={false} error={messagesDuChamp(fieldErrors, "telephone")} />

            {role === "PROPRIETAIRE" && (
              <Field id="iban" label="IBAN" placeholder="MG00 0000 0000 0000 0000" icon={<Wallet />} value={iban} onChange={setIban} error={messagesDuChamp(fieldErrors, "iban")} />
            )}

            <PasswordField id="signup-password" label="Mot de passe" value={password} onChange={setPassword} error={messagesDuChamp(fieldErrors, "password")} />
            <PasswordField id="confirm-password" label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} />

            <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground">
              <input required type="checkbox" className="mt-1 size-4 rounded border-input accent-primary" />
              <span>J&apos;accepte les <a href="#conditions" className="font-medium text-primary underline-offset-4 hover:underline">conditions d&apos;utilisation</a>.</span>
            </label>

            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
            {successMessage && <p role="status" className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">{successMessage}</p>}

            <button type="submit" disabled={isLoading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25">
              {isLoading ? "Création en cours..." : "Créer mon compte"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </form>
        </div>

        <p className="mt-7 text-center text-sm text-muted-foreground">Vous avez déjà un compte ? <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">Se connecter</Link></p>
      </section>
    </main>
  )
}

function RoleToggle({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  const labels: Record<Role, string> = {
    LOCATAIRE: "Locataire",
    PROPRIETAIRE: "Propriétaire",
    AGENT: "Agent",
  }

  return (
    <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl border border-input bg-background p-1">
      {(["LOCATAIRE", "PROPRIETAIRE", "AGENT"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={role === option}
          className={`h-10 rounded-lg text-sm font-medium transition ${
            role === option ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  )
}

function Field({
  id,
  label,
  placeholder,
  type = "text",
  icon,
  value,
  onChange,
  required = true,
  error,
}: {
  id: string
  label: string
  placeholder: string
  type?: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-card-foreground">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">{icon}</span>
        <input
          required={required}
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`h-12 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-4 focus:ring-ring/15 ${
            error ? "border-destructive focus:border-destructive" : "border-input focus:border-primary"
          }`}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-card-foreground">{label}</label>
      <div className="relative">
        <PasswordInput
          required
          id={id}
          minLength={8}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="8 caractères minimum"
          aria-invalid={Boolean(error)}
          error={Boolean(error)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
