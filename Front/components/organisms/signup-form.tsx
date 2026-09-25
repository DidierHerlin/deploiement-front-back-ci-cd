"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, LockKeyhole, Mail, Phone, UserRound, Wallet } from "lucide-react"
import { PasswordInput } from "@/components/atoms/password-input"
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
    <main className="flex min-h-screen text-foreground">
      {/* Côté gauche : Panneau Image */}
      <section className="relative hidden w-full flex-col justify-between p-12 text-white lg:flex lg:w-1/2 overflow-hidden">
        {/* Image et Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80"
            alt="Intérieur immobilier - ImmoConnect"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        </div>

        <div className="relative z-10 flex items-center gap-3" aria-label="Accueil">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm backdrop-blur-md">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <span className="font-sans text-xl font-semibold tracking-tight">ImmoConnect</span>
        </div>

        <div className="relative z-10 max-w-md">
          <span className="mb-4 inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur-md">
            100% SÉCURISÉ
          </span>
          <h2 className="mb-4 text-4xl font-bold leading-tight">Votre portail<br />immobilier intelligent</h2>
          <p className="mb-8 text-lg text-white/90">
            Déjà membre ? Connectez-vous à votre espace personnel pour retrouver vos tableaux de bord et suivre l'évolution de vos dossiers.
          </p>

          <div className="mb-10 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-md">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-white/20"><LockKeyhole className="size-5 text-white" /></div>
              <h3 className="font-semibold text-white">Chiffrement</h3>
              <p className="text-xs text-white/80 mt-1">Vos données et documents sont hautement protégés.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-md">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-white/20"><LockKeyhole className="size-5 text-white" /></div>
              <h3 className="font-semibold text-white">Temps réel</h3>
              <p className="text-xs text-white/80 mt-1">Notifications et mises à jour instantanées.</p>
            </div>
          </div>

          <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 px-8 text-sm font-bold transition-all hover:scale-105 hover:bg-white hover:text-primary backdrop-blur-md">
            Accéder à mon espace
          </Link>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          © {new Date().getFullYear()} ImmoConnect. Tous droits réservés.
        </div>
      </section>

      {/* Côté droit : Formulaire */}
      <section className="relative flex w-full flex-col items-center justify-center bg-slate-50/50 p-8 sm:p-12 lg:w-1/2">
        {/* Douces lumières en arrière-plan */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-[500px] rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:p-12">
          
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-inner">
              <LockKeyhole className="size-7" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Créer un compte</h1>
            <p className="mt-3 text-sm text-muted-foreground">Rejoignez-nous dès maintenant.</p>
          </div>

          <RoleToggle role={role} onChange={setRole} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="prenoms" label="Prénom(s)" placeholder="Camille" icon={<UserRound />} value={prenoms} onChange={setPrenoms} error={messagesDuChamp(fieldErrors, "prenoms")} />
              <Field id="nom" label="Nom" placeholder="Martin" icon={<UserRound />} value={nom} onChange={setNom} error={messagesDuChamp(fieldErrors, "nom")} />
            </div>

            <Field id="signup-email" label="Email" type="email" placeholder="vous@exemple.com" icon={<Mail />} value={email} onChange={setEmail} error={messagesDuChamp(fieldErrors, "email")} />

            <Field id="telephone" label="Téléphone (optionnel)" type="tel" placeholder="034 00 000 00" icon={<Phone />} value={telephone} onChange={setTelephone} required={false} error={messagesDuChamp(fieldErrors, "telephone")} />

            {role === "PROPRIETAIRE" && (
              <Field id="iban" label="IBAN" placeholder="MG00..." icon={<Wallet />} value={iban} onChange={setIban} error={messagesDuChamp(fieldErrors, "iban")} />
            )}

            <PasswordField id="signup-password" label="Mot de passe" value={password} onChange={setPassword} error={messagesDuChamp(fieldErrors, "password")} />
            <PasswordField id="confirm-password" label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} />

            <label className="flex items-start gap-3 text-sm font-medium leading-5 text-muted-foreground mt-2">
              <input required type="checkbox" className="mt-0.5 size-4 rounded border-input accent-primary" />
              <span>J'accepte les <a href="#conditions" className="font-bold text-primary transition-all hover:text-primary/80 hover:underline">conditions d'utilisation</a>.</span>
            </label>

            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
            {successMessage && <p role="status" className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">{successMessage}</p>}

            <button type="submit" disabled={isLoading} className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_16px_-4px_rgba(var(--primary),0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_20px_-4px_rgba(var(--primary),0.4)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? "Création en cours..." : "Créer mon compte"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            Déjà inscrit ? <Link href="/login" className="font-bold text-primary transition-all hover:text-primary/80 hover:underline">Se connecter</Link>
          </p>

        </div>
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
    <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-1">
      {(["LOCATAIRE", "PROPRIETAIRE", "AGENT"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={role === option}
          className={`h-10 rounded-lg text-sm font-medium transition-all ${
            role === option ? "bg-white text-foreground shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground"
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
    <div className="space-y-2.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4.5">{icon}</span>
        <input
          required={required}
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`h-12 w-full rounded-xl border border-input/60 bg-white/50 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 ${
            error ? "border-destructive focus:border-destructive hover:border-destructive" : ""
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
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
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
