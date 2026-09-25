"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react"
import { ForgotPasswordForm } from "@/components/organisms/forgot-password-form"
import { VerifyCodeForm } from "@/components/organisms/verify-code-form"
import { ResetPasswordForm } from "@/components/organisms/reset-password-form"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

type Etape = "email" | "code" | "nouveau-mdp" | "succes"

export default function ForgotPasswordPage() {
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
      const response = await fetch(`${API_URL}/mot-de-passe/demande/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? data.details?.email?.[0] ?? "Impossible d'envoyer le code.")
      }

      setEtape("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.")
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
      const response = await fetch(`${API_URL}/mot-de-passe/verifier-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? data.non_field_errors?.[0] ?? "Code invalide ou expiré.")
      }

      setEtape("nouveau-mdp")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.")
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Étape 3 : Réinitialiser le mot de passe ──────────────────
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
      const response = await fetch(`${API_URL}/mot-de-passe/reinitialiser/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Impossible de réinitialiser le mot de passe.")
      }

      setEtape("succes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.")
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
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Sérénité - ImmoConnect"
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
            ASSISTANCE
          </span>
          <h2 className="mb-4 text-4xl font-bold leading-tight">Pas de panique, on s'occupe<br />de tout.</h2>
          <p className="mb-8 text-lg text-white/90">
            Il arrive à tout le monde d'oublier son mot de passe. Suivez nos instructions sécurisées pour récupérer l'accès à votre espace.
          </p>
          
          <ul className="mb-10 space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md"><span className="text-xs font-bold text-white">1</span></div>
              <span className="font-medium">Saisissez votre adresse email associée à votre compte ImmoConnect.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md"><span className="text-xs font-bold text-white">2</span></div>
              <span className="font-medium">Recevez un code secret de sécurité à 6 chiffres par email.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md"><span className="text-xs font-bold text-white">3</span></div>
              <span className="font-medium">Créez votre nouveau mot de passe et reconnectez-vous !</span>
            </li>
          </ul>

          <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 px-8 text-sm font-bold transition-all hover:scale-105 hover:bg-white hover:text-primary backdrop-blur-md">
            Retour à la connexion
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

        <div className="relative z-10 w-full max-w-[460px] rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:p-12">
          
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden" aria-label="Retour à la connexion">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"><LockKeyhole className="size-5" aria-hidden="true" /></span>
            <span className="font-sans text-xl font-semibold tracking-tight">Immo<span className="text-primary">Connect</span></span>
          </div>

          {/* ─── Étape succès ─── */}
          {etape === "succes" && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-[1.25rem] bg-accent/20 text-accent shadow-inner">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Mot de passe modifié
              </h1>
              <p role="status" className="mt-3 text-sm leading-6 text-muted-foreground">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link
                href="/login"
                className="group mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_16px_-4px_rgba(var(--primary),0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_20px_-4px_rgba(var(--primary),0.4)] active:translate-y-0 active:shadow-none"
              >
                Se connecter
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

          <Link href="/login" className="mx-auto mt-8 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground lg:hidden">
            <ArrowLeft className="size-4" aria-hidden="true" /> Retour à la connexion
          </Link>
        </div>
      </section>
    </main>
  )
}
