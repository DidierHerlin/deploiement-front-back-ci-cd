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
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-md">
        <Link href="/login" className="mb-8 flex items-center justify-center gap-3" aria-label="Retour à la connexion">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
          <span className="font-sans text-xl font-semibold tracking-tight">
            Immo<span className="text-primary">Connect</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-7 shadow-[0_20px_70px_-35px_oklch(0.2_0.02_250/0.35)] sm:p-9">

          {/* ─── Étape succès ─── */}
          {etape === "succes" && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </div>
              <h1 className="font-sans text-3xl font-semibold tracking-tight text-card-foreground">
                Mot de passe modifié
              </h1>
              <p role="status" className="mt-3 text-sm leading-6 text-muted-foreground">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link
                href="/login"
                className="mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Se connecter
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

        </div>

        <Link href="/login" className="mx-auto mt-7 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Retour à la connexion
        </Link>
      </section>
    </main>
  )
}
