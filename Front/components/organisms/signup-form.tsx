"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Mail, Phone, UserRound, Wallet } from "lucide-react"
import { PasswordInput } from "@/components/atoms/password-input"
import { toast } from "sonner"
import { getApiUrl } from "@/lib/config"
import { useTranslation, LanguageSwitcher } from "@/lib/i18n"
import { ThemeToggle } from "@/components/molecules/ThemeToggle"

type Role = "LOCATAIRE" | "PROPRIETAIRE" | "AGENT"

type ApiErrorDetails = Record<string, string[]>

function messagesDuChamp(details: ApiErrorDetails | undefined, champ: string): string | undefined {
  return details?.[champ]?.[0]
}

const TOTAL_STEPS = 3

export function SignupForm() {
  const { t } = useTranslation()
  const router = useRouter()
  
  // Navigation séquentielle (Multi-step : 1 -> 2 -> 3)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [role, setRole] = useState<Role>("LOCATAIRE")

  // Étape 1 : Identité
  const [nom, setNom] = useState("")
  const [prenoms, setPrenoms] = useState("")

  // Étape 2 : Contact
  const [email, setEmail] = useState("")
  const [telephone, setTelephone] = useState("")

  // Étape 3 : Sécurité & Finalisation
  const [iban, setIban] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<ApiErrorDetails>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Validation Étape 1 -> Étape 2
  function handleNextStep1() {
    setError("")
    const errors: ApiErrorDetails = {}

    if (!nom.trim()) {
      errors.nom = [t("auth.signup.error_nom_required", "Le nom est obligatoire.")]
    }
    if (!prenoms.trim()) {
      errors.prenoms = [t("auth.signup.error_prenoms_required", "Le prénom est obligatoire.")]
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const err = t("auth.signup.error_identity_fields", "Veuillez renseigner votre nom et prénom(s).")
      setError(err)
      toast.error(err)
      return
    }

    setFieldErrors({})
    setError("")
    setStep(2)
  }

  // Validation Étape 2 -> Étape 3
  function handleNextStep2() {
    setError("")
    const errors: ApiErrorDetails = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.trim()) {
      errors.email = [t("auth.signup.error_email_required", "L'adresse email est obligatoire.")]
    } else if (!emailRegex.test(email.trim())) {
      errors.email = [t("auth.signup.error_email_invalid", "Veuillez saisir une adresse email valide.")]
    }

    const cleanPhone = telephone.trim().replace(/[\s\-\.\(\)]/g, "")
    if (!telephone.trim()) {
      errors.telephone = [t("auth.signup.error_phone_required", "Le numéro de téléphone est obligatoire.")]
    } else if (cleanPhone.length < 8 || !/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      errors.telephone = [t("auth.signup.error_phone_invalid", "Veuillez saisir un numéro de téléphone valide (au moins 8 chiffres).")]
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const err = t("auth.signup.error_contact_fields", "Veuillez vérifier vos coordonnées de contact.")
      setError(err)
      toast.error(err)
      return
    }

    setFieldErrors({})
    setError("")
    setStep(3)
  }

  // Retour à l'étape précédente
  function handlePrevStep(targetStep: 1 | 2) {
    setError("")
    setFieldErrors({})
    setStep(targetStep)
  }

  // Gestion de la touche Entrée pour naviguer entre étapes sans soumettre prématurément
  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") {
      if (step === 1) {
        event.preventDefault()
        handleNextStep1()
      } else if (step === 2) {
        event.preventDefault()
        handleNextStep2()
      }
    }
  }

  // Soumission finale (Étape 3)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (step === 1) {
      handleNextStep1()
      return
    }
    if (step === 2) {
      handleNextStep2()
      return
    }

    setError("")
    setFieldErrors({})
    setSuccessMessage("")

    if (role === "PROPRIETAIRE" && iban.trim().length === 0) {
      const err = t("auth.signup.error_iban_required", "L'IBAN est requis pour un compte propriétaire.")
      setFieldErrors({ iban: [err] })
      setError(err)
      toast.error(err)
      return
    }
    if (password.length < 8) {
      const err = t("auth.signup.error_password_length", "Le mot de passe doit contenir au moins 8 caractères.")
      setFieldErrors({ password: [err] })
      setError(err)
      toast.error(err)
      return
    }
    if (password !== confirmPassword) {
      const err = t("auth.signup.error_password_match", "Les mots de passe ne correspondent pas.")
      setFieldErrors({ confirmPassword: [err] })
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

      const contentType = response.headers.get("content-type")
      let data: any = null
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const errorText = !response.ok
          ? `Erreur ${response.status} : impossible de joindre le serveur d'inscription.`
          : "Format de réponse inattendu du serveur."
        toast.error(errorText)
        throw new Error(errorText)
      }

      if (!response.ok || !data?.success) {
        if (data?.details) {
          setFieldErrors(data.details)
          // Si l'erreur porte sur un champ d'une étape précédente, rediriger l'utilisateur vers cette étape
          if (data.details.nom || data.details.prenoms) {
            setStep(1)
          } else if (data.details.email || data.details.telephone) {
            setStep(2)
          }
        }
        const errorMsg = data?.error ?? t("auth.signup.error_failed", "Impossible de créer le compte.")
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

  const stepsMeta = [
    { num: 1, title: t("auth.signup.step_1_title", "Identité") },
    { num: 2, title: t("auth.signup.step_2_title", "Contact") },
    { num: 3, title: t("auth.signup.step_3_title", "Sécurité") },
  ]

  const stepSubtitles: Record<number, string> = {
    1: t("auth.signup.step_1_subtitle", "Renseignez votre profil et vos informations d'identité."),
    2: t("auth.signup.step_2_subtitle", "Indiquez vos coordonnées pour vous joindre et valider votre compte."),
    3: t("auth.signup.step_3_subtitle", "Définissez vos identifiants pour sécuriser votre espace personnel."),
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

      {/* Côté droit : Formulaire Séquentiel */}
      <section className="relative flex w-full flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-8 sm:p-12 lg:w-1/2 min-h-screen">
        {/* Barre d'action supérieure */}
        <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-md transition-all hover:bg-white dark:hover:bg-slate-800 hover:text-primary dark:hover:text-blue-400 hover:border-primary/40 dark:hover:border-blue-500/40 hover:shadow-md active:scale-95 cursor-pointer"
            aria-label={t("auth.signup.back_to_home", "Retour à l'accueil")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t("auth.signup.back_to_home", "Retour à l'accueil")}</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Douces lumières en arrière-plan */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-60" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-[500px] rounded-[2rem] border border-white/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-2xl backdrop-blur-xl sm:p-12">
          
          {/* En-tête */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 text-primary dark:text-blue-400 shadow-inner">
              <LockKeyhole className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t("auth.signup.create_account", "Créer un compte")}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {stepSubtitles[step]}
            </p>
          </div>

          {/* Indicateur visuel d'étape (Barre de progression + Stepper) */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                Étape {step} sur {TOTAL_STEPS}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {stepsMeta[step - 1].title}
              </span>
            </div>

            {/* Barre de progression animée */}
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            {/* Jalons d'étapes (1, 2, 3) */}
            <div className="mt-4 flex items-center justify-between">
              {stepsMeta.map((s, idx) => {
                const isDone = step > s.num
                const isCurrent = step === s.num
                return (
                  <div key={s.num} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                          isDone
                            ? "bg-emerald-500 text-white shadow-sm"
                            : isCurrent
                              ? "bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md scale-105"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {isDone ? <Check className="size-4 stroke-[3]" /> : s.num}
                      </div>
                      <span
                        className={`mt-1.5 text-[11px] transition-colors ${
                          isCurrent
                            ? "text-blue-600 dark:text-blue-400 font-bold"
                            : isDone
                              ? "text-slate-700 dark:text-slate-300 font-semibold"
                              : "text-slate-400 dark:text-slate-500 font-normal"
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                    {idx < stepsMeta.length - 1 && (
                      <div
                        className={`h-0.5 w-full mx-1 -mt-4 transition-colors duration-300 ${
                          step > s.num ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
            
            {/* ========================================================= */}
            {/* ÉTAPE 1 : Identité                                        */}
            {/* ========================================================= */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <RoleToggle role={role} onChange={setRole} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                {error && (
                  <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <button 
                  type="button" 
                  onClick={handleNextStep1}
                  className="group mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 text-sm font-semibold shadow-[0_8px_16px_-4px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_20px_-4px_rgba(37,99,235,0.4)] active:translate-y-0 active:shadow-none cursor-pointer"
                >
                  <span>{t("auth.signup.next_step", "Suivant")}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* ÉTAPE 2 : Contact                                         */}
            {/* ========================================================= */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
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

                {error && (
                  <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handlePrevStep(1)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    <span>{t("auth.signup.previous_step", "Précédent")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep2}
                    className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-[0_8px_16px_-4px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_20px_-4px_rgba(37,99,235,0.4)] active:translate-y-0 active:shadow-none cursor-pointer"
                  >
                    <span>{t("auth.signup.next_step", "Suivant")}</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* ÉTAPE 3 : Sécurité & Finalisation                         */}
            {/* ========================================================= */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
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
                    error={messagesDuChamp(fieldErrors, "confirmPassword")}
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                )}
                {successMessage && (
                  <p role="status" className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                    {successMessage}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handlePrevStep(2)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    <span>{t("auth.signup.previous_step", "Précédent")}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-[0_8px_16px_-4px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_20px_-4px_rgba(37,99,235,0.4)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <span>{t("auth.signup.submitting_btn", "Création en cours...")}</span>
                    ) : (
                      <>
                        <span>{t("auth.signup.submit_btn", "Créer mon compte")}</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Lien vers Connexion */}
          <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("auth.signup.already_account", "Vous avez déjà un compte ?")}{" "}
            <Link href="/login" className="font-bold text-primary dark:text-blue-400 transition-all hover:text-primary/80 dark:hover:text-blue-300 hover:underline">
              {t("auth.signup.sign_in", "Se connecter")}
            </Link>
          </p>

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
    AGENT: t("auth.signup.role_agent", "Agent / Gestionnaire"),
  }

  return (
    <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800 p-1.5">
      {(["LOCATAIRE", "PROPRIETAIRE", "AGENT"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={role === option}
          className={`h-10 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            role === option 
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700" 
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
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
      <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 [&>svg]:size-4.5">{icon}</span>
        <input
          required={required}
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/60 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:bg-white dark:hover:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 focus:border-primary dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-primary/10 dark:focus:ring-blue-500/10 ${
            error ? "border-destructive dark:border-destructive focus:border-destructive hover:border-destructive" : ""
          }`}
        />
      </div>
      {error && <p className="text-xs text-destructive dark:text-rose-400">{error}</p>}
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
      <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{label}</label>
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
      {error && <p className="text-xs text-destructive dark:text-rose-400">{error}</p>}
    </div>
  )
}
