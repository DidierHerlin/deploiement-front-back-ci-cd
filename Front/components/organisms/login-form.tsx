"use client"

import { useState, type FormEvent, useEffect } from "react"
import { ArrowRight, LockKeyhole, Mail } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { marquerConnecte, sauvegarderTokens, getAccessToken } from "@/lib/auth"
import { PasswordInput } from "@/components/atoms/password-input"
import { toast } from "sonner"
import { getApiUrl } from "@/lib/config"
import { useTranslation, LanguageSwitcher } from "@/lib/i18n"

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
  const { t } = useTranslation()
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
      response = await fetch(`${getApiUrl()}/auth/login/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
    } catch (networkError) {
      const msg = t("auth.login.error_network", "Impossible de joindre le serveur. Vérifie qu'il est démarré et accessible.")
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    let data: { success?: boolean; error?: string; user?: { role: string }; access?: string; refresh?: string }
    try {
      data = await response.json()
    } catch (parseError) {
      const msg = t("auth.login.error_unexpected", "Réponse inattendue du serveur.")
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    if (!response.ok || !data.success) {
      const msg = data.error ?? t("auth.login.error_failed", "Impossible de vous connecter.")
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    if (!data.user?.role || !data.access || !data.refresh) {
      const msg = t("auth.login.error_unexpected", "Réponse inattendue du serveur.")
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    sauvegarderTokens(data.access, data.refresh)
    marquerConnecte()
    toast.success(t("auth.login.login_success", "Connexion réussie"))

    const redirect = searchParams.get("redirect")
    const destination = redirect && redirect !== "/login" ? redirect : redirectionParRole(data.user.role)
    router.replace(destination)
    setIsLoading(false)
  }

  return (
    <main className="flex min-h-screen text-foreground relative">
      {/* Sélecteur de langue flottant en haut à droite */}
      <div className="absolute top-6 right-6 z-30">
        <LanguageSwitcher />
      </div>

      {/* Côté gauche : Panneau Image */}
      <section className="relative hidden w-full flex-col justify-between p-12 text-white lg:flex lg:w-1/2 overflow-hidden">
        {/* Image et Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
            alt="Maison moderne - ImmoConnect"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        </div>

        <a href="/" className="relative z-10 flex items-center gap-3 w-fit" aria-label="Accueil">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm backdrop-blur-md">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <span className="font-sans text-xl font-semibold tracking-tight">ImmoConnect</span>
        </a>

        <div className="relative z-10 max-w-md">
          <span className="mb-4 inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur-md">
            {t("auth.login.brand_subtitle", "PLATEFORME N°1")}
          </span>
          <h2 className="mb-4 text-4xl font-bold leading-tight">
            {t("auth.login.hero_title", "Gérez votre immobilier en toute simplicité")}
          </h2>
          <p className="mb-8 text-lg text-white/90">
            {t("auth.login.hero_desc", "ImmoConnect centralise la gestion de vos biens immobiliers. Rejoignez des milliers de propriétaires, locataires et professionnels.")}
          </p>
          
          <ul className="mb-10 space-y-4 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md"><LockKeyhole className="size-4" /></div>
              <span className="font-medium">{t("auth.login.feature_dashboards", "Tableaux de bord sur-mesure selon votre profil")}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md"><LockKeyhole className="size-4" /></div>
              <span className="font-medium">{t("auth.login.feature_payments", "Suivi des loyers, quittances et paiements")}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md"><LockKeyhole className="size-4" /></div>
              <span className="font-medium">{t("auth.login.feature_security", "Centralisation et sécurisation des documents")}</span>
            </li>
          </ul>

          <a href="/inscription" className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 px-8 text-sm font-bold transition-all hover:scale-105 hover:bg-white hover:text-primary backdrop-blur-md">
            {t("auth.login.create_account_btn", "Créer mon compte")}
          </a>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          {new Date().getFullYear()} ImmoConnect. {t("footer.rights", "Tous droits réservés.")}
        </div>
      </section>

      {/* Côté droit : Formulaire */}
      <section className="relative flex w-full flex-col items-center justify-center bg-slate-50/50 p-8 sm:p-12 lg:w-1/2">
        {/* Douces lumières en arrière-plan */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-[460px] rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:p-12">
          
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-inner">
              <LockKeyhole className="size-7" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("auth.login.welcome_back", "Bon retour !")}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{t("auth.login.welcome_subtitle", "Heureux de vous revoir parmi nous.")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {searchParams.get("expired") === "1" && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t("auth.login.session_expired", "Votre session a expiré. Veuillez vous reconnecter.")}
              </p>
            )}
            
            <div className="space-y-2.5">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">{t("auth.login.email_label", "Email")}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("auth.login.email_placeholder", "vous@exemple.com")} className="h-12 w-full rounded-xl border border-input/60 bg-white/50 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">{t("auth.login.password_label", "Mot de passe")}</label>
                <a href="/mot-de-passe-oublie" className="text-xs font-medium text-primary transition-all hover:text-primary/80 hover:underline">
                  {t("auth.login.forgot_password_link", "Mot de passe oublié ?")}
                </a>
              </div>
              <div className="relative">
                <PasswordInput id="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
              </div>
            </div>

            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={isLoading} className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_16px_-4px_rgba(var(--primary),0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_20px_-4px_rgba(var(--primary),0.4)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer">
              {isLoading ? t("auth.login.submitting_btn", "Connexion...") : t("auth.login.submit_btn", "Se connecter")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            {t("auth.login.no_account", "Pas encore de compte ?")}{" "}
            <a href="/inscription" className="font-bold text-primary transition-all hover:text-primary/80 hover:underline">
              {t("auth.login.sign_up", "S'inscrire")}
            </a>
          </p>

        </div>
      </section>
    </main>
  )
}
