"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, Phone, UserRound, Wallet } from "lucide-react"
import { PasswordInput } from "@/components/atoms/password-input"
import { toast } from "sonner"
import { getApiUrl } from "@/lib/config"
import { useTranslation, LanguageSwitcher } from "@/lib/i18n"

type Role = "LOCATAIRE" | "PROPRIETAIRE" | "AGENT"

type ApiErrorDetails = Record<string, string[]>

function messagesDuChamp(details: ApiErrorDetails | undefined, champ: string): string | undefined {
  return details?.[champ]?.[0]
}

export function SignupForm() {
  const { t } = useTranslation()
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
      const err = t("auth.signup.error_password_match", "Les mots de passe ne correspondent pas.")
      setError(err)
      toast.error(err)
      return
    }
    if (password.length < 8) {
      const err = t("auth.signup.error_password_length", "Le mot de passe doit contenir au moins 8 caractères.")
      setError(err)
      toast.error(err)
      return
    }
    if (role === "PROPRIETAIRE" && iban.trim().length === 0) {
      const err = t("auth.signup.error_iban_required", "L'IBAN est requis pour un compte propriétaire.")
      setError(err)
      toast.error(err)
      return
    }

    setIsLoading(true)

    try {
      const payload: Record<string, string> = {
        email,
        nom,
        prenoms,
        telephone,
        password,
        role,
      }
      if (role === "PROPRIETAIRE") {
        payload.iban = iban
      }

      const response = await fetch(`${getApiUrl()}/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (data.details) {
          setFieldErrors(data.details)
        }
        const errorMsg = data.error ?? t("auth.signup.error_failed", "Impossible de créer le compte.")
        toast.error(errorMsg)
        throw new Error(errorMsg)
      }

      const successMsg = t("auth.signup.signup_success", "Votre compte a été créé avec succès !")
          
      setSuccessMessage(successMsg)
      toast.success(successMsg)

      setTimeout(() => router.push("/login"), 2000)
    } catch (signupError) {
      const msg = signupError instanceof Error ? signupError.message : t("dashboard.common.error_occurred", "Une erreur est survenue.")
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen text-foreground relative">
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

        <Link href="/" className="relative z-10 flex items-center gap-3 w-fit transition-transform hover:scale-105" aria-label={t("auth.signup.back_to_home", "Retour à l'accueil")}>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm backdrop-blur-md">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <span className="font-sans text-xl font-semibold tracking-tight">ImmoConnect</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <span className="mb-4 inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur-md">
            100% SÉCURISÉ
          </span>
          <h2 className="mb-4 text-4xl font-bold leading-tight">
            {t("auth.login.hero_title", "Votre portail immobilier intelligent")}
          </h2>
          <p className="mb-8 text-lg text-white/90">
            {t("auth.login.hero_desc", "Déjà membre ? Connectez-vous à votre espace personnel pour retrouver vos tableaux de bord et suivre l'évolution de vos dossiers.")}
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
            {t("nav.sign_in", "Accéder à mon espace")}
          </Link>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          {new Date().getFullYear()} ImmoConnect. {t("footer.rights", "Tous droits réservés.")}
        </div>
      </section>

      {/* Côté droit : Formulaire */}
      <section className="relative flex w-full flex-col items-center justify-center bg-slate-50/50 p-8 sm:p-12 lg:w-1/2 min-h-screen">
        {/* Barre d'action supérieure : Bouton de retour à l'accueil et sélecteur de langue */}
        <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-primary hover:border-primary/40 hover:shadow-md active:scale-95 cursor-pointer"
            aria-label={t("auth.signup.back_to_home", "Retour à l'accueil")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t("auth.signup.back_to_home", "Retour à l'accueil")}</span>
          </Link>

          <LanguageSwitcher />
        </div>

        {/* Douces lumières en arrière-plan */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-[500px] rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:p-12">
          
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-inner">
              <LockKeyhole className="size-7" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("auth.signup.create_account", "Créer un compte")}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{t("auth.signup.create_subtitle", "Rejoignez ImmoConnect en quelques secondes.")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <RoleToggle role={role} onChange={setRole} />

            <div className="grid grid-cols-2 gap-3">
              <Field
                id="nom"
                label={t("auth.signup.last_name", "Nom")}
                placeholder={t("auth.signup.last_name_placeholder", "Dupont")}
                icon={<UserRound aria-hidden="true" />}
                value={nom}
                onChange={setNom}
                error={messagesDuChamp(fieldErrors, "nom")}
              />
              <Field
                id="prenoms"
                label={t("auth.signup.first_name", "Prénom(s)")}
                placeholder={t("auth.signup.first_name_placeholder", "Marie")}
                icon={<UserRound aria-hidden="true" />}
                value={prenoms}
                onChange={setPrenoms}
                error={messagesDuChamp(fieldErrors, "prenoms")}
              />
            </div>

            <Field
              id="email"
              type="email"
              label={t("auth.signup.email", "Email")}
              placeholder={t("auth.signup.email_placeholder", "vous@exemple.com")}
              icon={<Mail aria-hidden="true" />}
              value={email}
              onChange={setEmail}
              error={messagesDuChamp(fieldErrors, "email")}
            />

            <Field
              id="telephone"
              type="tel"
              label={t("auth.signup.phone", "Téléphone")}
              placeholder={t("auth.signup.phone_placeholder", "034 00 000 00")}
              icon={<Phone aria-hidden="true" />}
              value={telephone}
              onChange={setTelephone}
              error={messagesDuChamp(fieldErrors, "telephone")}
            />

            {role === "PROPRIETAIRE" && (
              <Field
                id="iban"
                label={t("auth.signup.iban", "IBAN / Relevé bancaire")}
                placeholder={t("auth.signup.iban_placeholder", "MG46 ...")}
                icon={<Wallet aria-hidden="true" />}
                value={iban}
                onChange={setIban}
                error={messagesDuChamp(fieldErrors, "iban")}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PasswordField
                id="password"
                label={t("auth.signup.password", "Mot de passe")}
                value={password}
                onChange={setPassword}
                error={messagesDuChamp(fieldErrors, "password")}
              />
              <PasswordField
                id="confirmPassword"
                label={t("auth.signup.confirm_password", "Confirmation")}
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>

            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
            {successMessage && <p role="status" className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">{successMessage}</p>}

            <button type="submit" disabled={isLoading} className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_16px_-4px_rgba(var(--primary),0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_20px_-4px_rgba(var(--primary),0.4)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer">
              {isLoading ? t("auth.signup.submitting_btn", "Création en cours...") : t("auth.signup.submit_btn", "Créer mon compte")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            {t("auth.signup.already_account", "Déjà inscrit ?")}{" "}
            <Link href="/login" className="font-bold text-primary transition-all hover:text-primary/80 hover:underline">
              {t("auth.signup.sign_in", "Se connecter")}
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary cursor-pointer"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>{t("auth.signup.back_to_home", "Retour à l'accueil")}</span>
            </Link>
          </div>

        </div>
      </section>
    </main>
  )
}

function RoleToggle({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  const { t } = useTranslation()
  const labels: Record<Role, string> = {
    LOCATAIRE: t("auth.signup.role_tenant", "Locataire"),
    PROPRIETAIRE: t("auth.signup.role_owner", "Propriétaire"),
    AGENT: t("auth.signup.role_agent", "Agent"),
  }

  return (
    <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-1">
      {(["LOCATAIRE", "PROPRIETAIRE", "AGENT"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={role === option}
          className={`h-10 rounded-lg text-sm font-medium transition-all cursor-pointer ${
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
