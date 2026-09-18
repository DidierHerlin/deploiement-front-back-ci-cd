"use client"

import { useState, type FormEvent, useEffect } from "react"
import { ArrowRight, LockKeyhole, Mail } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { marquerConnecte, sauvegarderTokens, getAccessToken } from "@/lib/auth"
import { PasswordInput } from "@/components/ui/password-input"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

// Redirection par défaut après connexion, si aucun ?redirect= n'est fourni par le middleware.
function redirectionParRole(role: string) {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard"
    case "AGENT":
      return "/agent/dashboard"
    case "PROPRIETAIRE":
      return "/proprietaire/dashboard"
    case "LOCATAIRE":
    default:
      return "/locataire/dashboard"
  }
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Pare la navigation côté client (soft navigation) si l'utilisateur fait "Retour"
  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/") // Le dispatcher racine le renverra au bon endroit
    }
  }, [router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    let response: Response
    try {
      response = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
    } catch (networkError) {
      const msg = "Impossible de joindre le serveur. Vérifie qu'il est démarré et accessible."
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    let data: { success?: boolean; error?: string; user?: { role: string }; access?: string; refresh?: string }
    try {
      data = await response.json()
    } catch (parseError) {
      const msg = `Réponse inattendue du serveur (statut ${response.status}). Vérifie les logs Django.`
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    if (!response.ok || !data.success) {
      const msg = data.error ?? "Impossible de vous connecter."
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    if (!data.user?.role || !data.access || !data.refresh) {
      const msg = "Réponse de connexion incomplète du serveur."
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    sauvegarderTokens(data.access, data.refresh)
    marquerConnecte()
    toast.success("Connexion réussie")

    const redirect = searchParams.get("redirect")
    const destination = redirect && redirect !== "/login" ? redirect : redirectionParRole(data.user.role)
    router.replace(destination)
    setIsLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3" aria-label="Accueil">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <span className="font-sans text-xl font-semibold tracking-tight">Immo<span className="text-primary">Connect</span></span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-7 shadow-[0_20px_70px_-35px_oklch(0.2_0.02_250/0.35)] sm:p-9">
          <div className="mb-8 text-center">
            <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Espace sécurisé</p>
            <h1 className="font-sans text-3xl font-semibold tracking-tight text-card-foreground">Bon retour</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Connectez-vous pour accéder à votre espace immobilier.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {searchParams.get("expired") === "1" && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Votre session a expiré. Veuillez vous reconnecter.
              </p>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-card-foreground">Adresse email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/15" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-medium text-card-foreground">Mot de passe</label>
                <a href="/mot-de-passe-oublie" className="text-xs font-medium text-primary underline-offset-4 hover:underline">Mot de passe oublié ?</a>
              </div>
              <div className="relative">
                <PasswordInput id="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
              </div>
            </div>

            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={isLoading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25">
              {isLoading ? "Connexion..." : "Se connecter"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </form>
        </div>

        <p className="mt-7 text-center text-sm text-muted-foreground">Vous n&apos;avez pas encore de compte ? <a href="/inscription" className="font-semibold text-primary underline-offset-4 hover:underline">Créer un compte</a></p>
      </section>
    </main>
  )
}
