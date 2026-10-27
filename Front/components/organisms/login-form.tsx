"use client"

import { useState, type FormEvent, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { marquerConnecte, marquerDeconnecte, sauvegarderTokens, getAccessToken, isTokenValid } from "@/lib/auth"
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

  // Vérifie si une session valide existe déjà, sinon nettoie un token obsolète
  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      if (isTokenValid(token)) {
        try {
          const payloadBase64 = token.split(".")[1]
          if (payloadBase64) {
            const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
            const payload = JSON.parse(payloadJson)
            const role = (payload.role || "LOCATAIRE").toUpperCase()
            const redirect = searchParams.get("redirect")
            const destination = redirect && redirect !== "/login" && redirect !== "/connexion"
              ? redirect
              : redirectionParRole(role)
            router.replace(destination)
            return
          }
        } catch {
          marquerDeconnecte()
        }
      } else {
        marquerDeconnecte()
      }
    }
  }, [router, searchParams])

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
    const destination = redirect && redirect !== "/login" && redirect !== "/connexion" ? redirect : redirectionParRole(data.user.role)
    router.replace(destination)
    setIsLoading(false)
  }

  return (
    <main className="flex min-h-screen text-foreground relative">
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

        <Link href="/" className="relative z-10 flex items-center gap-3 w-fit transition-transform hover:scale-105" aria-label={t("auth.login.back_to_home", "Retour à l'accueil")}>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm backdrop-blur-md">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <span className="font-sans text-xl font-semibold tracking-tight">ImmoConnect</span>
        </Link>

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

          <Link href="/inscription" className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 px-8 text-sm font-bold transition-all hover:scale-105 hover:bg-white hover:text-primary backdrop-blur-md">
            {t("auth.login.create_account_btn", "Créer mon compte")}
          </Link>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          {new Date().getFullYear()} ImmoConnect. {t("footer.rights", "Tous droits réservés.")}
        </div>
      </section>

      {/* Côté droit : Formulaire */}
      <section className="relative flex w-full flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-8 sm:p-12 lg:w-1/2 min-h-screen">
        {/* Barre d'action supérieure : Bouton de retour à l'accueil et sélecteur de langue */}
        <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-md transition-all hover:bg-white dark:hover:bg-slate-800 hover:text-primary dark:hover:text-blue-400 hover:border-primary/40 dark:hover:border-blue-500/40 hover:shadow-md active:scale-95 cursor-pointer"
            aria-label={t("auth.login.back_to_home", "Retour à l'accueil")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t("auth.login.back_to_home", "Retour à l'accueil")}</span>
          </Link>

          <LanguageSwitcher />
        </div>

        {/* Douces lumières en arrière-plan */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-60" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-[460px] rounded-[2rem] border border-white/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-2xl backdrop-blur-xl sm:p-12">
          
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 text-primary dark:text-blue-400 shadow-inner">
              <LockKeyhole className="size-7" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t("auth.login.welcome_back", "Bon retour !")}</h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t("auth.login.welcome_subtitle", "Heureux de vous revoir parmi nous.")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {searchParams.get("expired") === "1" && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t("auth.login.session_expired", "Votre session a expiré. Veuillez vous reconnecter.")}
              </p>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{t("auth.login.email_label", "Email")}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                <input 
                  id="email" 
                  type="email" 
                  required 
                  autoComplete="email" 
                  value={email} 
                  onChange={(event) => setEmail(event.target.value)} 
                  placeholder={t("auth.login.email_placeholder", "vous@exemple.com")} 
                  className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/60 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:bg-white dark:hover:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 focus:border-primary dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-primary/10 dark:focus:ring-blue-500/10" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{t("auth.login.password_label", "Mot de passe")}</label>
                <Link href="/mot-de-passe-oublie" className="text-xs font-medium text-primary dark:text-blue-400 transition-all hover:text-primary/80 dark:hover:text-blue-300 hover:underline">
                  {t("auth.login.forgot_password_link", "Mot de passe oublié ?")}
                </Link>
              </div>
              <div className="relative">
                <PasswordInput id="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
              </div>
            </div>

            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

            <button 
              type="submit" 
              disabled={isLoading} 
              className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 text-sm font-semibold shadow-[0_8px_16px_-4px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_20px_-4px_rgba(37,99,235,0.4)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? t("auth.login.submitting_btn", "Connexion...") : t("auth.login.submit_btn", "Se connecter")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("auth.login.no_account", "Pas encore de compte ?")}{" "}
            <Link href="/inscription" className="font-bold text-primary dark:text-blue-400 transition-all hover:text-primary/80 dark:hover:text-blue-300 hover:underline">
              {t("auth.login.sign_up", "S'inscrire")}
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors hover:text-primary dark:hover:text-blue-400 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>{t("auth.login.back_to_home", "Retour à l'accueil")}</span>
            </Link>
          </div>

        </div>
      </section>
    </main>
  )
}
