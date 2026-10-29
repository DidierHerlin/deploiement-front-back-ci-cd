"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MapPin,
  Maximize2,
  DoorOpen,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  UserPlus,
  X,
  RefreshCw,
  Heart,
  Home,
  ShieldCheck,
  Compass,
  Key,
  Tag,
  Menu,
  FileText,
  Building,
} from "lucide-react"

import {
  Bien,
  fetchBiensDisponibles,
  formatPrixBien,
  getTypeBienLabel,
  getPhotoBienUrl,
} from "@/services/bienService"
import { isTokenValid } from "@/lib/auth"
import { resolveMediaUrl } from "@/lib/api"
import { useTranslation, LanguageSwitcher } from "@/lib/i18n"
import { ThemeToggle } from "@/components/molecules/ThemeToggle"

interface AuthUser {
  token: string
  role: string
  dashboardUrl: string
  nom?: string
}

export default function HomePage() {
  const router = useRouter()
  const { t, lang } = useTranslation()

  // Authentification facultative (pour l'en-tête dynamique)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  // Données des biens
  const [biens, setBiens] = useState<Bien[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filtres interactifs
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [modeFilter, setModeFilter] = useState<string>("TOUS")
  const [typeFilter, setTypeFilter] = useState<string>("TOUS")

  // Coups de cœur / favoris enregistrés localement
  const [favorites, setFavorites] = useState<number[]>([])

  // Modal de découverte du bien
  const [selectedBien, setSelectedBien] = useState<Bien | null>(null)
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState<number>(0)

  // États de navigation et modales du header
  const [showFeaturesMenu, setShowFeaturesMenu] = useState<boolean>(false)
  const [showCguModal, setShowCguModal] = useState<boolean>(false)
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false)

  const featuresMenuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu fonctionnalités au clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        featuresMenuRef.current &&
        !featuresMenuRef.current.contains(event.target as Node)
      ) {
        setShowFeaturesMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Récupération de la session utilisateur
  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token")
      if (token && isTokenValid(token)) {
        const payloadBase64 = token.split(".")[1]
        if (payloadBase64) {
          const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
          const payload = JSON.parse(payloadJson)
          const role = (payload.role || "LOCATAIRE").toUpperCase()

          let dashboardUrl = "/locataire/dashboard"
          if (role === "ADMIN") dashboardUrl = "/admin/dashboard"
          else if (role === "AGENT") dashboardUrl = "/agent/dashboard"
          else if (role === "PROPRIETAIRE") dashboardUrl = "/proprietaire/dashboard"

          setCurrentUser({
            token,
            role,
            dashboardUrl,
            nom: payload.nom || payload.email || payload.prenoms || undefined,
          })
        }
      }
    } catch {
      setCurrentUser(null)
    }

    // Récupérer les favoris du stockage local
    try {
      const savedFavs = localStorage.getItem("immoconnect_favorites")
      if (savedFavs) setFavorites(JSON.parse(savedFavs))
    } catch {
      // Ignorer si non disponible
    }
  }, [])

  // Basculer un favori
  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      try {
        localStorage.setItem("immoconnect_favorites", JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  // Chargement des biens disponibles depuis l'API backend publique
  const loadBiens = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBiensDisponibles({
        search: searchTerm,
        type: typeFilter,
        mode_transaction: modeFilter,
      })
      setBiens(data)
    } catch (err: any) {
      setError(err?.message || t("error.generic"))
    } finally {
      setLoading(false)
    }
  }, [searchTerm, typeFilter, modeFilter, t])

  useEffect(() => {
    loadBiens()
  }, [loadBiens])

  // Filtrage réactif instantané
  const filteredBiens = useMemo(() => {
    return biens.filter((bien) => {
      if (modeFilter !== "TOUS" && bien.mode_transaction !== modeFilter) {
        return false
      }
      if (typeFilter !== "TOUS" && bien.type?.toUpperCase() !== typeFilter) {
        return false
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchTitre = bien.titre?.toLowerCase().includes(q)
        const matchAdresse = bien.adresse?.toLowerCase().includes(q)
        const matchType = getTypeBienLabel(bien.type, lang).toLowerCase().includes(q)
        if (!matchTitre && !matchAdresse && !matchType) return false
      }
      return true
    })
  }, [biens, modeFilter, typeFilter, searchTerm, lang])

  const hasActiveFilters = searchTerm.trim() !== "" || modeFilter !== "TOUS" || typeFilter !== "TOUS"

  const resetFilters = () => {
    setSearchTerm("")
    setModeFilter("TOUS")
    setTypeFilter("TOUS")
  }

  const openBienDetail = (bien: Bien) => {
    setSelectedBien(bien)
    setCurrentPhotoIdx(0)
  }

  const closeBienDetail = () => {
    setSelectedBien(null)
    setCurrentPhotoIdx(0)
  }

  const scrollToCatalog = () => {
    const el = document.getElementById("catalogue-biens")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-stone-800 dark:text-slate-200 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/30 dark:selection:text-blue-200">
      {/* =========================================================================
          1. HEADER SIGNATURE IMMOCONNECT AVEC SÉLECTEUR DE THÈME & LANGUE (FR / EN)
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 dark:bg-slate-900/80 backdrop-blur-xl border-b border-[#EDE6DC] dark:border-slate-800 transition-all shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 lg:gap-6">
          {/* Logo signature & Slogan */}
          <Link href="/" className="flex items-center gap-3.5 group shrink-0" aria-label="Accueil ImmoConnect">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300 shrink-0">
              <Home className="size-5.5 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div className="flex flex-col shrink-0">
              <span className="font-sans text-xl font-extrabold tracking-tight text-stone-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                ImmoConnect
              </span>
           
            </div>
          </Link>

          {/* Navigation centrale (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5 shrink-0">
            {/* Bouton raccourci Catalogue */}
            <button
              onClick={scrollToCatalog}
              className="inline-flex items-center whitespace-nowrap px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold text-stone-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-stone-100/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer shrink-0"
            >
              <span className="whitespace-nowrap">{t("nav.catalog")}</span>
            </button>

            {/* Menu déroulant Fonctionnalités par profil */}
            <div className="relative shrink-0" ref={featuresMenuRef}>
              <button
                onClick={() => setShowFeaturesMenu((prev) => !prev)}
                className={`inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
                  showFeaturesMenu
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                    : "text-stone-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-stone-100/70 dark:hover:bg-slate-800/70"
                }`}
              >
                <span className="whitespace-nowrap">{t("nav.features")}</span>
                <ChevronDown
                  className={`size-4 shrink-0 transition-transform duration-200 ${
                    showFeaturesMenu ? "rotate-180 text-blue-600 dark:text-blue-400" : "text-stone-400 dark:text-slate-500"
                  }`}
                />
              </button>

              {/* Panneau déroulant Méga-menu Fonctionnalités */}
              {showFeaturesMenu && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[440px] max-w-[92vw] bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-stone-300/40 dark:shadow-black/60 border border-[#EDE6DC] dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="grid gap-1.5">
                    {/* Profil Locataire */}
                    <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-slate-700 group cursor-pointer">
                      <div className="flex size-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Key className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {t("features_menu.tenant_title")}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {t("features_menu.tenant_desc")}
                        </p>
                      </div>
                    </div>

                    {/* Profil Propriétaire */}
                    <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-amber-50/60 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-amber-100 dark:hover:border-slate-700 group cursor-pointer">
                      <div className="flex size-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Building className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                          {t("features_menu.owner_title")}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {t("features_menu.owner_desc")}
                        </p>
                      </div>
                    </div>

                    {/* Profil Agences & Gestionnaires */}
                    <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-indigo-50/60 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-slate-700 group cursor-pointer">
                      <div className="flex size-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ShieldCheck className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {t("features_menu.admin_title")}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {t("features_menu.admin_desc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lien Conditions d'utilisation */}
            <button
              onClick={() => setShowCguModal(true)}
              className="inline-flex items-center whitespace-nowrap px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold text-stone-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-stone-100/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer shrink-0"
            >
              <span className="whitespace-nowrap">{t("nav.terms")}</span>
            </button>
          </nav>

          {/* Actions utilisateurs & Sélecteurs de thème & langue */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Basculeur de thème clair / sombre */}
            <div className="shrink-0">
              <ThemeToggle />
            </div>

            {/* Sélecteur de langue discret FR / EN */}
            <div className="shrink-0">
              <LanguageSwitcher />
            </div>

            {/* Boutons d'accès auth */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <div className="hidden lg:flex flex-col text-right shrink-0">
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200 whitespace-nowrap">
                    {t("nav.hello")}, {currentUser.nom || t("nav.guest")}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                    Espace {currentUser.role}
                  </span>
                </div>
                <Link
                  href={currentUser.dashboardUrl}
                  className="inline-flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/20 transition-all duration-200 hover:shadow-md hover:scale-[1.02] shrink-0"
                >
                  <LayoutDashboard className="size-4 shrink-0" />
                  <span className="whitespace-nowrap">{t("nav.my_space")}</span>
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Link
                  href="/login"
                  className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-stone-100/80 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <LogIn className="size-4 shrink-0 text-stone-500 dark:text-slate-400" />
                  <span className="whitespace-nowrap">{t("nav.sign_in")}</span>
                </Link>
                <Link
                  href="/inscription"
                  className="inline-flex items-center whitespace-nowrap gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
                >
                  <UserPlus className="size-4 shrink-0" />
                  <span className="whitespace-nowrap">{t("nav.create_account")}</span>
                </Link>
              </div>
            )}

            {/* Bouton Burger Mobile */}
            <button
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Menu"
              className="md:hidden flex size-10 items-center justify-center rounded-xl border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* =========================================================================
            MENU BURGER MOBILE RESPONSIVE
        ========================================================================= */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#EDE6DC] dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-950 px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
            {/* Liens de navigation mobile */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setMobileNavOpen(false)
                  scrollToCatalog()
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                {t("nav.catalog")}
              </button>

              <button
                onClick={() => {
                  setMobileNavOpen(false)
                  setShowCguModal(true)
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <span>{t("nav.terms")}</span>
              </button>
            </div>

            {/* Accordéon Fonctionnalités pour mobile */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-[#EDE6DC] dark:border-slate-800 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 px-1">
                {t("nav.features")}
              </span>
              <div className="grid gap-2">
                <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-slate-300 p-2 rounded-lg bg-stone-50 dark:bg-slate-800/60">
                  <Key className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span><strong>{t("features_menu.tenant_title")} :</strong> {t("features_menu.tenant_desc")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-slate-300 p-2 rounded-lg bg-stone-50 dark:bg-slate-800/60">
                  <Building className="size-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span><strong>{t("features_menu.owner_title")} :</strong> {t("features_menu.owner_desc")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-slate-300 p-2 rounded-lg bg-stone-50 dark:bg-slate-800/60">
                  <ShieldCheck className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span><strong>{t("features_menu.admin_title")} :</strong> {t("features_menu.admin_desc")}</span>
                </div>
              </div>
            </div>

            {/* Actions d'authentification mobile */}
            <div className="pt-2 border-t border-stone-200 dark:border-slate-800 space-y-2">
              {currentUser ? (
                <Link
                  href={currentUser.dashboardUrl}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-600/20"
                >
                  <LayoutDashboard className="size-4" />
                  <span>{t("nav.my_space")}</span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-slate-800"
                  >
                    <LogIn className="size-4" />
                    <span>{t("nav.sign_in")}</span>
                  </Link>
                  <Link
                    href="/inscription"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm shadow-blue-600/20"
                  >
                    <UserPlus className="size-4" />
                    <span>{t("nav.create_account")}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. SECTION D'ACCUEIL & RECHERCHE (STYLE ÉPURÉ & PROFESSIONNEL)
      ========================================================================= */}
      <section className="relative overflow-hidden py-10 sm:py-12 px-4 sm:px-6 lg:px-8 border-b border-[#EDE6DC] dark:border-slate-800 bg-gradient-to-b from-blue-50/30 via-[#FAF7F2] to-[#FAF7F2] dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950">
        {/* Halo doux en arrière-plan */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[760px] h-[360px] bg-gradient-to-r from-blue-100/20 via-slate-100/25 to-amber-50/20 dark:from-blue-950/20 dark:via-slate-900/20 dark:to-slate-900/10 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="w-full max-w-4xl mx-auto text-center mb-8">
          {/* Titre simple, direct et chaleureux */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-[1.2]">
            {t("hero.title_start")}{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {t("hero.title_highlight")}
            </span>{" "}
            {t("hero.title_end")}
          </h1>

          {/* Sous-titre sobre et direct */}
          <p className="mt-3.5 text-sm sm:text-base md:text-lg text-stone-600 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* =========================================================================
            BARRE DE RECHERCHE INTUITIVE & ÉPURÉE
        ========================================================================= */}
        <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(37,99,235,0.06)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-[#EDE6DC] dark:border-slate-800 p-3 sm:p-4 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Champ de recherche texte */}
            <div className="md:col-span-4 relative">
              <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") scrollToCatalog()
                }}
                placeholder={t("search.placeholder")}
                className="w-full pl-11 pr-9 py-3 bg-[#FAF7F2] dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 rounded-2xl border border-stone-200/90 dark:border-slate-800 text-sm text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  title={t("search.clear_search")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Sélecteur Mode de transaction (Location & Vente) */}
            <div className="md:col-span-3">
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="w-full px-3.5 py-3 bg-[#FAF7F2] dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 rounded-2xl border border-stone-200/90 dark:border-slate-800 text-sm text-stone-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="TOUS" className="dark:bg-slate-900 dark:text-slate-200">{t("search.mode_all")}</option>
                <option value="LOCATION" className="dark:bg-slate-900 dark:text-slate-200">{t("search.mode_location")}</option>
                <option value="VENTE" className="dark:bg-slate-900 dark:text-slate-200">{t("search.mode_vente")}</option>
              </select>
            </div>

            {/* Sélecteur Type de bien */}
            <div className="md:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3.5 py-3 bg-[#FAF7F2] dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 rounded-2xl border border-stone-200/90 dark:border-slate-800 text-sm text-stone-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="TOUS" className="dark:bg-slate-900 dark:text-slate-200">{t("search.type_all")}</option>
                <option value="APPARTEMENT" className="dark:bg-slate-900 dark:text-slate-200">{t("search.type_apartment")}</option>
                <option value="MAISON" className="dark:bg-slate-900 dark:text-slate-200">{t("search.type_house")}</option>
                <option value="LOCAL_COMMERCIAL" className="dark:bg-slate-900 dark:text-slate-200">{t("search.type_commercial")}</option>
                <option value="TERRAIN" className="dark:bg-slate-900 dark:text-slate-200">{t("search.type_land")}</option>
              </select>
            </div>

            {/* Bouton d'action Rechercher & réinitialisation discrète */}
            <div className="md:col-span-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer whitespace-nowrap"
              >
                <Search className="size-4 shrink-0" />
                <span>{t("search.btn_search", "Rechercher")}</span>
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  title={t("search.reset_title", "Réinitialiser les critères")}
                  className="p-3 rounded-2xl border border-stone-200/90 dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-950 text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-900 transition-all cursor-pointer shrink-0"
                >
                  <RefreshCw className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtres rapides sobres & Compteur de biens disponibles */}
        <div className="w-full max-w-4xl mx-auto mt-4 sm:mt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "TOUS", label: t("search.pill_all") },
              { id: "LOCATION", label: t("search.pill_rent") },
              { id: "VENTE", label: t("search.pill_buy") },
            ].map((m) => {
              const active = modeFilter === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModeFilter(m.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-stone-100/80 dark:hover:bg-slate-800 border border-stone-200/80 dark:border-slate-800"
                  }`}
                >
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 text-stone-600 dark:text-slate-400 font-medium">
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-slate-400">
                <Loader2 className="size-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                {t("search.discovering")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-stone-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-[#EDE6DC] dark:border-slate-800 shadow-2xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <strong>{filteredBiens.length}</strong>{" "}
                {filteredBiens.length > 1 ? t("search.available_plural") : t("search.available_singular")}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. GRILLE DE BIENS : CARTES ÉLÉGANTES SUR FOND LUMINEUX
      ========================================================================= */}
      <main id="catalogue-biens" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Notification en cas d'erreur réseau */}
        {error && (
          <div className="mb-10 p-6 rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-950 dark:text-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <AlertCircle className="size-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                  {t("error.title")}
                </h3>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={loadBiens}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>{t("error.retry")}</span>
            </button>
          </div>
        )}

        {/* État de chargement élégant (Skeletons doux) */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EDE6DC] dark:border-slate-800 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-52 sm:h-56 bg-stone-200/60 dark:bg-slate-800" />
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="h-4 bg-stone-200/70 dark:bg-slate-800 rounded-full w-1/3" />
                  <div className="h-5 bg-stone-200/70 dark:bg-slate-800 rounded-full w-4/5" />
                  <div className="h-3 bg-stone-200/70 dark:bg-slate-800 rounded-full w-2/3" />
                  <div className="pt-4 border-t border-stone-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="h-6 bg-stone-200/70 dark:bg-slate-800 rounded-full w-2/5" />
                    <div className="h-9 bg-stone-200/70 dark:bg-slate-800 rounded-xl w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aucun résultat avec message bienveillant et humain */}
        {!loading && !error && filteredBiens.length === 0 && (
          <div className="text-center py-20 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-[#EDE6DC] dark:border-slate-800 max-w-2xl mx-auto shadow-xs">
            <div className="size-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <Compass className="size-8 stroke-[1.7]" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white">
              {t("empty.title")}
            </h3>
            <p className="mt-2 text-sm text-stone-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {t("empty.desc")}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>{t("empty.reset_btn")}</span>
              </button>
            )}
          </div>
        )}

        {/* =========================================================================
            GRILLE DES CARTES DE BIENS (PROPERTY CARDS ÉLÉGANTES ET PURS BLANCS)
        ========================================================================= */}
        {!loading && !error && filteredBiens.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBiens.map((bien) => {
              const photoUrl = getPhotoBienUrl(bien)
              const isLocation = bien.mode_transaction === "LOCATION"
              const typeLabel = getTypeBienLabel(bien.type, lang)
              const formattedPrice = formatPrixBien(bien, lang)
              const isFav = favorites.includes(bien.id)

              return (
                <div
                  key={bien.id}
                  onClick={() => openBienDetail(bien)}
                  className="group bg-white dark:bg-slate-900 rounded-3xl border border-[#EDE6DC] dark:border-slate-800 overflow-hidden shadow-[0_4px_20px_-6px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.12)] dark:hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col cursor-pointer hover:border-blue-200 dark:hover:border-slate-700"
                >
                  {/* Photo & Badges d'ambiance */}
                  <div className="relative h-52 sm:h-56 bg-stone-100 dark:bg-slate-800 overflow-hidden rounded-t-3xl">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={bien.titre}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 dark:text-slate-500 bg-gradient-to-b from-stone-100 to-stone-200/60 dark:from-slate-800 dark:to-slate-900">
                        <Home className="size-12 stroke-[1.2] mb-1.5 text-stone-400 dark:text-slate-500" />
                        <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                          {t("card.photos_pending")}
                        </span>
                      </div>
                    )}

                    {/* Gradient doux en bas de l'image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 pointer-events-none" />

                    {/* Badges discrets et élégants en haut */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-blue-600 dark:bg-blue-500 text-white shadow-xs backdrop-blur-md">
                        {isLocation ? t("card.for_rent") : t("card.for_sale")}
                      </span>

                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 dark:bg-emerald-600 text-white shadow-xs backdrop-blur-md flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-white animate-pulse" />
                        {t("card.ready_move_in")}
                      </span>
                    </div>

                    {/* Bouton Coup de cœur (Favori) */}
                    <button
                      onClick={(e) => toggleFavorite(bien.id, e)}
                      title={isFav ? t("card.fav_remove") : t("card.fav_add")}
                      className={`absolute top-4 right-4 size-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer ${
                        isFav
                          ? "bg-rose-500 text-white scale-110"
                          : "bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 text-stone-700 dark:text-slate-200 hover:text-rose-500 hover:scale-105"
                      }`}
                    >
                      <Heart className={`size-4 ${isFav ? "fill-white" : ""}`} />
                    </button>

                    {/* Nombre de photos si disponible */}
                    {bien.photos && bien.photos.length > 1 && (
                      <div className="absolute bottom-3 right-4 bg-black/60 dark:bg-slate-950/70 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        {bien.photos.length} {t("card.photos_count")}
                      </div>
                    )}
                  </div>

                  {/* Corps de la carte */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    {/* Type de bien & Réf */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200/60 dark:border-blue-900/60">
                        <Tag className="size-3" />
                        {typeLabel}
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">
                        {t("card.ref")}{bien.id}
                      </span>
                    </div>

                    {/* Titre chaleureux */}
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                      {bien.titre}
                    </h3>

                    {/* Adresse avec icône douce */}
                    <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5 mb-3.5 line-clamp-1">
                      <MapPin className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{bien.adresse}</span>
                    </p>

                    {/* Caractéristiques (Surface & Pièces) */}
                    <div className="grid grid-cols-2 gap-2 py-2.5 px-3 bg-[#FAF7F2] dark:bg-slate-950/70 rounded-2xl mb-4 text-xs text-stone-600 dark:text-slate-400 border border-[#EDE6DC]/70 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Maximize2 className="size-4 text-stone-400 dark:text-slate-500" />
                        <span>
                          <strong className="text-stone-800 dark:text-slate-200">{bien.surface}</strong> {t("card.living_surface")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DoorOpen className="size-4 text-stone-400 dark:text-slate-500" />
                        <span>
                          {bien.nombre_pieces ? (
                            <>
                              <strong className="text-stone-800 dark:text-slate-200">{bien.nombre_pieces}</strong> {t("card.rooms")}
                            </>
                          ) : (
                            <span className="text-stone-400 dark:text-slate-500">{t("card.flexible_space")}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Ligne Prix + Action bouton bleu élégant */}
                    <div className="mt-auto pt-3.5 border-t border-[#EDE6DC] dark:border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[11px] text-stone-400 dark:text-slate-500 font-medium">
                          {isLocation ? t("card.monthly_rent") : t("card.sale_price")}
                        </span>
                        <div className="text-base sm:text-lg font-extrabold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          {formattedPrice}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openBienDetail(bien)
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
                      >
                        <span>{t("card.discover")}</span>
                        <ArrowUpRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* =========================================================================
          4. BANNIÈRE D'ACCOMPAGNEMENT HUMAIN
      ========================================================================= */}
      <section className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-amber-50/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-900 border-t border-b border-[#EDE6DC] dark:border-slate-800 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white">
              {t("banner.title")}
            </h3>
            <p className="text-sm text-stone-600 dark:text-slate-400 max-w-xl">
              {t("banner.desc")}
            </p>
          </div>
          <Link
            href="/inscription"
            className="shrink-0 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all duration-200 hover:scale-105"
          >
            {t("banner.cta")}
          </Link>
        </div>
      </section>

      {/* =========================================================================
          5. MODAL DÉTAILS D'UN BIEN : LIVRE D'ACCUEIL CHALEUREUX
      ========================================================================= */}
      {selectedBien && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-[#EDE6DC] dark:border-slate-800 my-8">
            {/* Bouton Fermer */}
            <button
              onClick={closeBienDetail}
              className="absolute top-4 right-4 z-20 size-10 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center justify-center shadow-md transition-all duration-150 hover:scale-105 cursor-pointer"
            >
              <X className="size-5" />
            </button>

            {/* Galerie photos */}
            <div className="relative h-64 sm:h-84 bg-stone-900">
              {selectedBien.photos && selectedBien.photos.length > 0 ? (
                <>
                  <img
                    src={resolveMediaUrl(selectedBien.photos[currentPhotoIdx]) || ""}
                    alt={selectedBien.titre}
                    className="w-full h-full object-cover"
                  />
                  {selectedBien.photos.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentPhotoIdx((prev) =>
                            prev === 0 ? selectedBien.photos.length - 1 : prev - 1
                          )
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentPhotoIdx((prev) =>
                            (prev + 1) % selectedBien.photos.length
                          )
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                      >
                        <ChevronRight className="size-5" />
                      </button>
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                        {selectedBien.photos.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPhotoIdx(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              idx === currentPhotoIdx ? "w-6 bg-white" : "w-2 bg-white/60"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-800">
                  <Home className="size-16 stroke-[1.2] mb-2 text-stone-400" />
                  <span className="text-sm">{t("modal.photos_pending")}</span>
                </div>
              )}

              {/* Badges sur l'image du modal */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 dark:bg-blue-500 text-white shadow-xs">
                  {selectedBien.mode_transaction === "LOCATION" ? t("modal.rent") : t("modal.sale")}
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                  {t("card.ready_move_in")}
                </span>
              </div>
            </div>

            {/* Contenu du Modal */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/60">
                    {getTypeBienLabel(selectedBien.type, lang)}
                  </span>
                  <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white mt-2">
                    {selectedBien.titre}
                  </h2>
                  <p className="text-sm text-stone-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{selectedBien.adresse}</span>
                  </p>
                </div>
                <div className="sm:text-right shrink-0 bg-[#FAF7F2] dark:bg-slate-950 sm:bg-transparent dark:sm:bg-transparent p-3 sm:p-0 rounded-2xl">
                  <span className="text-xs text-stone-400 dark:text-slate-500 uppercase font-semibold block">
                    {selectedBien.mode_transaction === "LOCATION" ? t("card.monthly_rent") : t("card.sale_price")}
                  </span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {formatPrixBien(selectedBien, lang)}
                  </span>
                </div>
              </div>

              {/* Fiche des caractéristiques */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-[#FAF7F2] dark:bg-slate-950 rounded-2xl my-5 text-center border border-[#EDE6DC] dark:border-slate-800">
                <div className="border-r border-[#EDE6DC] dark:border-slate-800 pr-2">
                  <span className="text-xs text-stone-500 dark:text-slate-400 block">{t("modal.surface")}</span>
                  <span className="text-base font-bold text-stone-900 dark:text-white">
                    {selectedBien.surface} m²
                  </span>
                </div>
                <div className="border-r border-[#EDE6DC] dark:border-slate-800 pr-2">
                  <span className="text-xs text-stone-500 dark:text-slate-400 block">{t("modal.rooms")}</span>
                  <span className="text-base font-bold text-stone-900 dark:text-white">
                    {selectedBien.nombre_pieces ? `${selectedBien.nombre_pieces} ${t("card.rooms")}` : t("modal.free_space")}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-500 dark:text-slate-400 block">{t("modal.project")}</span>
                  <span className="text-base font-bold text-stone-900 dark:text-white">
                    {selectedBien.mode_transaction === "LOCATION" ? t("modal.rent") : t("modal.sale")}
                  </span>
                </div>
              </div>

              {/* Phrase bienveillante */}
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-xs text-emerald-900 dark:text-emerald-300 mb-6">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {t("modal.verified_notice")}
                </span>
              </div>

              {/* Actions de réservation / visite */}
              <div className="pt-4 border-t border-[#EDE6DC] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={closeBienDetail}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t("modal.continue_exploring")}
                </button>

                {currentUser ? (
                  <Link
                    href="/locataire/biens"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <span>{t("modal.book_option")}</span>
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/login?redirect=${encodeURIComponent("/locataire/biens")}`}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <LogIn className="size-4" />
                    <span>{t("modal.sign_in_to_book")}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MODAL CONDITIONS D'UTILISATION (RÉSUMÉ CLAIR, HUMAIN ET RASSURANT)
      ========================================================================= */}
      {showCguModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-[#EDE6DC] dark:border-slate-800 overflow-hidden my-8">
            {/* Header modal CGU */}
            <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 items-center justify-center">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                    {t("cgu.title")}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    {t("cgu.subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCguModal(false)}
                className="size-9 rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Contenu textuel CGU : 4 points clairs, humains et rassurants */}
            <div className="p-6 sm:p-8 space-y-3.5 max-h-[62vh] overflow-y-auto">
              {/* Point 1 : Transparence des annonces */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-stone-50/80 dark:bg-slate-800/50 border border-stone-100 dark:border-slate-800">
                <div className="flex size-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                    {t("cgu.sec1_title")}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                    {t("cgu.sec1_text")}
                  </p>
                </div>
              </div>

              {/* Point 2 : Réservation et baux sécurisés */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-stone-50/80 dark:bg-slate-800/50 border border-stone-100 dark:border-slate-800">
                <div className="flex size-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 items-center justify-center shrink-0 mt-0.5">
                  <Key className="size-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                    {t("cgu.sec2_title")}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                    {t("cgu.sec2_text")}
                  </p>
                </div>
              </div>

              {/* Point 3 : Suivi des paiements et quittances */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-stone-50/80 dark:bg-slate-800/50 border border-stone-100 dark:border-slate-800">
                <div className="flex size-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 items-center justify-center shrink-0 mt-0.5">
                  <FileText className="size-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                    {t("cgu.sec3_title")}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                    {t("cgu.sec3_text")}
                  </p>
                </div>
              </div>

              {/* Point 4 : Protection de vos données personnelles */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-stone-50/80 dark:bg-slate-800/50 border border-stone-100 dark:border-slate-800">
                <div className="flex size-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                    {t("cgu.sec4_title")}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                    {t("cgu.sec4_text")}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer modal CGU */}
            <div className="px-6 sm:px-8 py-4 bg-stone-50/60 dark:bg-slate-950/60 border-t border-stone-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowCguModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                {t("cgu.understood_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. FOOTER CHALEUREUX & HARMONIEUX
      ========================================================================= */}
      <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-[#EDE6DC] dark:border-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Home className="size-4" />
            </div>
            <div>
              <span className="font-bold text-stone-800 dark:text-slate-200">ImmoConnect</span>
              <span className="text-stone-400 dark:text-slate-500 ml-2">— {t("footer.brand_note")}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => setShowCguModal(true)}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              {t("footer.terms")}
            </button>
            <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t("footer.client_space")}
            </Link>
            <Link href="/inscription" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t("footer.create_account")}
            </Link>
            <span>&copy; {new Date().getFullYear()} ImmoConnect. {t("footer.rights")}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
