"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, LockKeyhole, ArrowRight } from "lucide-react"
import { ForgotPasswordForm } from "@/components/organisms/forgot-password-form"
import { VerifyCodeForm } from "@/components/organisms/verify-code-form"
import { ResetPasswordForm } from "@/components/organisms/reset-password-form"
import { getApiUrl } from "@/lib/config"
import { useTranslation, LanguageSwitcher } from "@/lib/i18n"
import { ThemeToggle } from "@/components/molecules/ThemeToggle"

type Etape = "email" | "code" | "nouveau-mdp" | "succes"

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    if (response.status === 404) {
      throw new Error("Service indisponible ou adresse introuvable (Erreur 404).")
    }
    if (response.status >= 500) {
      throw new Error("Erreur serveur temporaire. Veuillez réessayer dans un instant (Erreur 500).")
    }
    throw new Error(`Réponse inattendue du serveur (${response.status}).`)
  }
  try {
    return await response.json()
  } catch {
    throw new Error("Impossible de lire les données retournées par le serveur.")
  }
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [etape, setEtape] = useState<Etape>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // ─── Étape 1 : Demander le code ────────────────────────────────
  async function handleDemandeCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${getApiUrl()}/mot-de-passe/demande/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await parseApiResponse(response)

      if (!response.ok || data.success === false) {
        throw new Error(data.error ?? data.details?.email?.[0] ?? "Impossible d'envoyer le code.")
      }

      setEtape("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.common.error_occurred", "Une erreur est survenue."))
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Étape 2 : Vérifier le code ────────────────────────────────
  async function handleVerifierCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      let response = await fetch(`${getApiUrl()}/mot-de-passe/verifier-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      // Fallback vers l'alias /mot-de-passe/verifier/ en cas de 404
      if (response.status === 404) {
        response = await fetch(`${getApiUrl()}/mot-de-passe/verifier/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        })
      }

      const data = await parseApiResponse(response)

      if (!response.ok || data.success === false || data.valid === false) {
        throw new Error(data.error ?? data.message ?? "Code invalide ou expiré.")
      }

      setEtape("nouveau-mdp")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.common.error_occurred", "Une erreur est survenue."))
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Étape 3 : Réinitialiser le mot de passe ───────────────────
  async function handleReinitialiser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    setIsLoading(true)

    try {
      let response = await fetch(`${getApiUrl()}/mot-de-passe/reinitialiser/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: newPassword, password: newPassword }),
      })

      // Fallback vers l'alias /mot-de-passe/confirmer/ en cas de 404
      if (response.status === 404) {
        response = await fetch(`${getApiUrl()}/mot-de-passe/confirmer/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, new_password: newPassword, password: newPassword }),
        })
      }

      const data = await parseApiResponse(response)

      if (!response.ok || data.success === false) {
        throw new Error(data.error ?? data.details?.new_password?.[0] ?? "Impossible de réinitialiser le mot de passe.")
      }

      setEtape("succes")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.common.error_occurred", "Une erreur est survenue."))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground relative">
      {/* Côté gauche : Panneau Image */}
      <section className="relative hidden w-full flex-col justify-between p-12 text-white lg:flex lg:w-1/2 overflow-hidden">
        {/* Image et Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Sérénité - ImmoConnect"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-3 w-fit transition-transform hover:scale-105" aria-label={t("auth.back_to_home", "Retour à l'accueil")}>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm backdrop-blur-md">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <span className="font-sans text-xl font-semibold tracking-tight">ImmoConnect</span>
        </Link>
        
        <div className="relative z-10 max-w-md">
          <span className="mb-4 inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur-md">
            ASSISTANCE
          </span>
          <h2 className="mb-4 text-4xl font-bold leading-tight">
            {t("auth.forgot_password.title_step1", "Pas de panique, on s'occupe de tout.")}
          </h2>
          <p className="mb-8 text-lg text-white/90">
            {t("auth.forgot_password.subtitle_step1", "Suivez nos instructions sécurisées pour récupérer l'accès à votre espace.")}
          </p>
          
          <ul className="mb-10 space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md"><span className="text-xs font-bold text-white">1</span></div>
              <span className="font-medium">{t("auth.forgot_password.subtitle_step1", "Saisissez votre adresse email associée à votre compte ImmoConnect.")}</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md"><span className="text-xs font-bold text-white">2</span></div>
              <span className="font-medium">{t("auth.forgot_password.subtitle_step2", "Recevez un code secret de sécurité à 6 chiffres par email.")}</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md"><span className="text-xs font-bold text-white">3</span></div>
              <span className="font-medium">{t("auth.forgot_password.subtitle_step3", "Créez votre nouveau mot de passe et reconnectez-vous !")}</span>
            </li>
          </ul>

          <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 px-8 text-sm font-bold transition-all hover:scale-105 hover:bg-white hover:text-primary backdrop-blur-md">
            {t("auth.forgot_password.btn_back_login", "Retour à la connexion")}
          </Link>
        </div>

        <div className="relative z-10 text-sm text-white/60">
           {new Date().getFullYear()} ImmoConnect. {t("footer.rights", "Tous droits réservés.")}
        </div>
      </section>

      {/* Côté droit : Formulaire */}
      <section className="relative flex w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8 sm:p-12 lg:w-1/2 min-h-screen">
        {/* Barre d'action supérieure : Bouton de retour à l'accueil et sélecteur de langue */}
        <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm backdrop-blur-md transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 cursor-pointer"
            aria-label={t("auth.back_to_home", "Retour à l'accueil")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t("auth.back_to_home", "Retour à l'accueil")}</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Douces lumières en arrière-plan */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-60" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-[460px] rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
          
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden" aria-label="Retour à la connexion">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"><LockKeyhole className="size-5" aria-hidden="true" /></span>
            <span className="font-sans text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Immo<span className="text-primary">Connect</span></span>
          </div>

          {/* ─── Étape succès ─── */}
          {etape === "succes" && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-[1.25rem] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t("auth.forgot_password.title_step4", "Mot de passe modifié")}
              </h1>
              <p role="status" className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t("auth.forgot_password.subtitle_step4", "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.")}
              </p>
              <Link
                href="/login"
                className="group mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95"
              >
                {t("auth.login.submit_btn", "Se connecter")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          )}

          {/* ─── Étape 1 : Email ─── */}
          {etape === "email" && (
            <ForgotPasswordForm
              email={email}
              setEmail={setEmail}
              onSubmit={handleDemandeCode}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* ─── Étape 2 : Code ─── */}
          {etape === "code" && (
            <VerifyCodeForm
              email={email}
              code={code}
              setCode={setCode}
              onSubmit={handleVerifierCode}
              onResend={() => { setEtape("email"); setError(""); setCode(""); }}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* ─── Étape 3 : Nouveau mot de passe ─── */}
          {etape === "nouveau-mdp" && (
            <ResetPasswordForm
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              onSubmit={handleReinitialiser}
              isLoading={isLoading}
              error={error}
            />
          )}

          <div className="mt-8 flex justify-center">
            <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="size-4" aria-hidden="true" /> {t("auth.forgot_password.btn_back_login", "Retour à la connexion")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
