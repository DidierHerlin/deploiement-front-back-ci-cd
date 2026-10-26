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
  Sparkles,
  Heart,
  Home,
  ShieldCheck,
  Compass,
  Smile,
  Key,
  CalendarCheck,
  Tag,
  Menu,
  FileText,
  Users,
  Building,
  Check,
  HelpCircle,
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

interface AuthUser {
  token: string
  role: string
  dashboardUrl: string
  nom?: string
}

export default function HomePage() {
  const router = useRouter()

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
      setError(
        err?.message ||
          "Nous ne parvenons pas à afficher les biens pour l'instant. Prenez une respiration et réessayez dans un instant."
      )
    } finally {
      setLoading(false)
    }
  }, [searchTerm, typeFilter, modeFilter])

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
        const matchType = getTypeBienLabel(bien.type).toLowerCase().includes(q)
        if (!matchTitre && !matchAdresse && !matchType) return false
      }
      return true
    })
  }, [biens, modeFilter, typeFilter, searchTerm])

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
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* =========================================================================
          1. HEADER SIGNATURE IMMOCONNECT AVEC NAVIGATION ENRICHIE
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-xl border-b border-[#EDE6DC] transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo signature & Slogan */}
          <Link href="/" className="flex items-center gap-3.5 group shrink-0" aria-label="Accueil ImmoConnect">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300">
              <Home className="size-5.5 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-xl font-extrabold tracking-tight text-stone-900 group-hover:text-blue-600 transition-colors">
                ImmoConnect
              </span>
              <span className="text-[11px] text-stone-500 font-medium tracking-wide">
                L&apos;immobilier à visage humain
              </span>
            </div>
          </Link>

          {/* Navigation centrale (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {/* Bouton raccourci Catalogue */}
            <button
              onClick={scrollToCatalog}
              className="px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold text-stone-600 hover:text-blue-600 hover:bg-stone-100/70 transition-colors"
            >
              Biens disponibles
            </button>

            {/* Menu déroulant Fonctionnalités par profil */}
            <div className="relative" ref={featuresMenuRef}>
              <button
                onClick={() => setShowFeaturesMenu((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-colors ${
                  showFeaturesMenu
                    ? "bg-blue-50 text-blue-700"
                    : "text-stone-600 hover:text-blue-600 hover:bg-stone-100/70"
                }`}
              >
                <span>Fonctionnalités</span>
                <ChevronDown
                  className={`size-4 transition-transform duration-200 ${
                    showFeaturesMenu ? "rotate-180 text-blue-600" : "text-stone-400"
                  }`}
                />
              </button>

              {/* Panneau déroulant Méga-menu Fonctionnalités */}
              {showFeaturesMenu && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[480px] bg-white rounded-3xl shadow-xl shadow-stone-300/40 border border-[#EDE6DC] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-3 pb-2 border-b border-stone-100">
                    Découvrir la plateforme selon votre profil
                  </div>

                  <div className="grid gap-2.5 mt-2.5">
                    {/* Profil Locataire */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-blue-50/60 transition-colors border border-transparent hover:border-blue-100 group">
                      <div className="flex size-10 rounded-xl bg-blue-100 text-blue-600 items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Key className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
                            Espace Locataire
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-50 text-blue-600">
                            Candidat & Résident
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Suivi des paiements, quittances téléchargeables, consultation des biens disponibles et gestion de vos réservations.
                        </p>
                      </div>
                    </div>

                    {/* Profil Propriétaire */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-amber-50/60 transition-colors border border-transparent hover:border-amber-100 group">
                      <div className="flex size-10 rounded-xl bg-amber-100 text-amber-700 items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Building className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                            Espace Propriétaire
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-50 text-amber-700">
                            Bailleurs
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Publication et gestion de vos biens, suivi des loyers perçus, contrats de bail et état d&apos;occupation en temps réel.
                        </p>
                      </div>
                    </div>

                    {/* Profil Admin & Agent */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-indigo-50/60 transition-colors border border-transparent hover:border-indigo-100 group">
                      <div className="flex size-10 rounded-xl bg-indigo-100 text-indigo-600 items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ShieldCheck className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-stone-900 group-hover:text-indigo-600 transition-colors">
                            Espace Administrateur & Agent
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-600">
                            Gestion Pro
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Supervision globale, validation des utilisateurs et contrats, reporting financier et sécurité documentaire.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lien Conditions d'utilisation (ouvre la modale CGU) */}
            <button
              onClick={() => setShowCguModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold text-stone-600 hover:text-blue-600 hover:bg-stone-100/70 transition-colors"
            >
              <FileText className="size-4 text-stone-400" />
              <span>Conditions d&apos;utilisation</span>
            </button>
          </nav>

          {/* Actions utilisateurs (Connecté vs Visiteur) */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-stone-800">
                    Bonjour, {currentUser.nom || "cher visiteur"}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">
                    Espace {currentUser.role}
                  </span>
                </div>
                <Link
                  href={currentUser.dashboardUrl}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/20 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                >
                  <LayoutDashboard className="size-4" />
                  <span>Mon Espace</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 hover:text-blue-600 hover:bg-stone-100/80 transition-colors"
                >
                  <LogIn className="size-4 text-stone-500" />
                  <span>Se connecter</span>
                </Link>
                <Link
                  href="/inscription"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <UserPlus className="size-4" />
                  <span className="hidden sm:inline">Créer mon compte</span>
                  <span className="sm:hidden">Inscription</span>
                </Link>
              </div>
            )}
          </div>

          {/* Bouton Burger Mobile */}
          <button
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Ouvrir le menu de navigation"
            className="md:hidden flex size-10 items-center justify-center rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100/80 transition-colors"
          >
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* =========================================================================
            MENU BURGER MOBILE RESPONSIVE
        ========================================================================= */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#EDE6DC] bg-[#FAF7F2] px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
            {/* Liens de navigation mobile */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setMobileNavOpen(false)
                  scrollToCatalog()
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-700 hover:bg-white transition-colors"
              >
                Explorer les biens disponibles
              </button>

              <button
                onClick={() => {
                  setMobileNavOpen(false)
                  setShowCguModal(true)
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-700 hover:bg-white transition-colors"
              >
                <FileText className="size-4 text-stone-400" />
                <span>Conditions d&apos;utilisation (CGU)</span>
              </button>
            </div>

            {/* Accordéon Fonctionnalités pour mobile */}
            <div className="bg-white rounded-2xl p-3 border border-[#EDE6DC] space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">
                Nos fonctionnalités
              </span>
              <div className="grid gap-2">
                <div className="flex items-center gap-2.5 text-xs text-stone-700 p-2 rounded-lg bg-stone-50">
                  <Key className="size-4 text-blue-600 shrink-0" />
                  <span><strong>Locataire :</strong> Suivi des loyers, quittances et réservations</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-stone-700 p-2 rounded-lg bg-stone-50">
                  <Building className="size-4 text-amber-700 shrink-0" />
                  <span><strong>Propriétaire :</strong> Publication de biens et gestion des baux</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-stone-700 p-2 rounded-lg bg-stone-50">
                  <ShieldCheck className="size-4 text-indigo-600 shrink-0" />
                  <span><strong>Agent / Admin :</strong> Supervision globale et reporting</span>
                </div>
              </div>
            </div>

            {/* Actions d'authentification mobile */}
            <div className="pt-2 border-t border-stone-200 space-y-2">
              {currentUser ? (
                <Link
                  href={currentUser.dashboardUrl}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-600/20"
                >
                  <LayoutDashboard className="size-4" />
                  <span>Accéder à Mon Espace</span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50"
                  >
                    <LogIn className="size-4" />
                    <span>Connexion</span>
                  </Link>
                  <Link
                    href="/inscription"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm shadow-blue-600/20"
                  >
                    <UserPlus className="size-4" />
                    <span>Créer un compte</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. SECTION D'ACCUEIL & RECHERCHE (UX EMPATHIQUE & CENTRÉE SUR LE FOYER)
      ========================================================================= */}
      <section className="relative overflow-hidden pt-14 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#EDE6DC] bg-gradient-to-b from-blue-50/40 via-[#FAF7F2] to-[#FAF7F2]">
        {/* Halos doux en arrière-plan */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[760px] h-[360px] bg-gradient-to-r from-blue-200/20 via-indigo-100/25 to-amber-100/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-10">
          {/* Badge doux rassurant */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-blue-800 text-xs font-semibold shadow-xs border border-blue-200/80 mb-5 animate-in fade-in duration-500">
            <Sparkles className="size-3.5 text-blue-600" />
            <span>Des lieux de vie prêts à vous accueillir</span>
          </div>

          {/* Titre orienté projet de vie */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.15]">
            Trouvez l&apos;endroit où commence votre <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">nouvelle histoire</span>
          </h1>

          {/* Sous-titre bienveillant */}
          <p className="mt-4 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Que vous rêviez d&apos;un cocon douillet où poser vos valises, d&apos;une maison chaleureuse pour votre famille ou d&apos;un espace pour vos projets, découvrez des biens sélectionnés avec soin et transparents.
          </p>

          {/* Micro-textes rassurants & badges de confiance */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-600 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-[#EDE6DC] shadow-2xs">
              <ShieldCheck className="size-4 text-emerald-600" />
              Logements vérifiés & certifiés
            </span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-[#EDE6DC] shadow-2xs">
              <CalendarCheck className="size-4 text-blue-600" />
              Disponibilité en temps réel
            </span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-[#EDE6DC] shadow-2xs">
              <Smile className="size-4 text-amber-600" />
              Accompagnement simple & humain
            </span>
          </div>
        </div>

        {/* =========================================================================
            BARRE DE RECHERCHE INTUITIVE & FILTRES DYNAMIQUES
        ========================================================================= */}
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(37,99,235,0.06)] border border-[#EDE6DC] p-3 sm:p-5 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            {/* Champ de recherche texte */}
            <div className="md:col-span-5 relative">
              <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Où aimeriez-vous poser vos valises ? (ville, quartier...)"
                className="w-full pl-11 pr-9 py-3 bg-[#FAF7F2] hover:bg-white focus:bg-white rounded-2xl border border-stone-200/90 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  title="Effacer la recherche"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Sélecteur Mode de vie (Location vs Achat) */}
            <div className="md:col-span-3">
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="w-full px-3.5 py-3 bg-[#FAF7F2] hover:bg-white focus:bg-white rounded-2xl border border-stone-200/90 text-sm text-stone-700 font-semibold focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="TOUS">Tous nos projets (Location & Achat)</option>
                <option value="LOCATION">Pour louer un cocon (Location)</option>
                <option value="VENTE">Pour devenir propriétaire (Vente)</option>
              </select>
            </div>

            {/* Sélecteur Type de lieu */}
            <div className="md:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3.5 py-3 bg-[#FAF7F2] hover:bg-white focus:bg-white rounded-2xl border border-stone-200/90 text-sm text-stone-700 font-semibold focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="TOUS">Tous types de lieux</option>
                <option value="APPARTEMENT">Appartement chaleureux</option>
                <option value="MAISON">Maison de famille</option>
                <option value="LOCAL_COMMERCIAL">Local pour votre activité</option>
                <option value="TERRAIN">Terrain pour bâtir votre rêve</option>
              </select>
            </div>

            {/* Réinitialisation rapide */}
            <div className="md:col-span-1 flex justify-center">
              <button
                onClick={resetFilters}
                title="Réinitialiser tous les critères"
                disabled={!hasActiveFilters}
                className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-center w-full md:w-auto ${
                  hasActiveFilters
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    : "bg-[#FAF7F2] text-stone-300 border-stone-200 cursor-not-allowed"
                }`}
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Pilules de filtres thématiques & Compteur rassurant */}
        <div className="max-w-4xl mx-auto mt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-500 font-semibold mr-1 flex items-center gap-1.5">
              <Compass className="size-3.5 text-blue-600" />
              Envie de :
            </span>
            {[
              { id: "TOUS", label: "Tout explorer", icon: Sparkles },
              { id: "LOCATION", label: "Louer un cocon", icon: Key },
              { id: "VENTE", label: "Acheter & s'installer", icon: Home },
            ].map((m) => {
              const Icon = m.icon
              const active = modeFilter === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setModeFilter(m.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all duration-200 ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "bg-white text-stone-600 hover:text-blue-700 hover:bg-stone-100/80 border border-stone-200/80"
                  }`}
                >
                  <Icon className={`size-3.5 ${active ? "text-blue-200" : "text-stone-400"}`} />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 text-stone-600 font-medium">
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-stone-600">
                <Loader2 className="size-3.5 animate-spin text-blue-600" />
                Découverte des pépites en cours...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-stone-700 bg-white px-3.5 py-1 rounded-full border border-[#EDE6DC] shadow-2xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <strong>{filteredBiens.length}</strong> {filteredBiens.length > 1 ? "adresses prêtes à vous accueillir" : "adresse prête à vous accueillir"}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. GRILLE DE BIENS : CARTES ÉLÉGANTES SUR FOND LUMINEUX
      ========================================================================= */}
      <main id="catalogue-biens" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Notification en cas d'erreur réseau */}
        {error && (
          <div className="mb-10 p-6 rounded-3xl bg-blue-50/80 border border-blue-200 text-blue-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <AlertCircle className="size-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-blue-950">
                  Un petit contretemps dans le chargement
                </h3>
                <p className="text-xs text-blue-800 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={loadBiens}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw className="size-3.5" />
              <span>Réessayer maintenant</span>
            </button>
          </div>
        )}

        {/* État de chargement élégant (Skeletons doux) */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-[#EDE6DC] overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-60 bg-stone-200/60" />
                <div className="p-6 space-y-3.5">
                  <div className="h-4 bg-stone-200/70 rounded-full w-1/3" />
                  <div className="h-5 bg-stone-200/70 rounded-full w-4/5" />
                  <div className="h-3 bg-stone-200/70 rounded-full w-2/3" />
                  <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                    <div className="h-6 bg-stone-200/70 rounded-full w-2/5" />
                    <div className="h-9 bg-stone-200/70 rounded-xl w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aucun résultat avec message bienveillant et humain */}
        {!loading && !error && filteredBiens.length === 0 && (
          <div className="text-center py-20 px-6 bg-white rounded-3xl border border-dashed border-[#EDE6DC] max-w-2xl mx-auto shadow-xs">
            <div className="size-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Compass className="size-8 stroke-[1.7]" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">
              Aucun coup de cœur avec ces critères
            </h3>
            <p className="mt-2 text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              Ne vous découragez pas ! Élargissez un peu votre recherche ou réinitialisez les critères pour découvrir tous nos lieux de vie disponibles.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <RefreshCw className="size-3.5" />
                <span>Découvrir tous les biens disponibles</span>
              </button>
            )}
          </div>
        )}

        {/* =========================================================================
            GRILLE DES CARTES DE BIENS (PROPERTY CARDS ÉLÉGANTES ET PURS BLANCS)
        ========================================================================= */}
        {!loading && !error && filteredBiens.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBiens.map((bien) => {
              const photoUrl = getPhotoBienUrl(bien)
              const isLocation = bien.mode_transaction === "LOCATION"
              const typeLabel = getTypeBienLabel(bien.type)
              const formattedPrice = formatPrixBien(bien)
              const isFav = favorites.includes(bien.id)

              return (
                <div
                  key={bien.id}
                  onClick={() => openBienDetail(bien)}
                  className="group bg-white rounded-3xl border border-[#EDE6DC] overflow-hidden shadow-[0_4px_20px_-6px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Photo & Badges d'ambiance */}
                  <div className="relative h-60 bg-stone-100 overflow-hidden rounded-t-3xl">
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
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-gradient-to-b from-stone-100 to-stone-200/60">
                        <Home className="size-12 stroke-[1.2] mb-1.5 text-stone-400" />
                        <span className="text-xs font-medium text-stone-500">
                          Photos en cours d&apos;ajout
                        </span>
                      </div>
                    )}

                    {/* Gradient doux en bas de l'image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 pointer-events-none" />

                    {/* Badges discrets et élégants en haut */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-blue-600 text-white shadow-xs backdrop-blur-md">
                        {isLocation ? "À louer" : "À acquérir"}
                      </span>

                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-white shadow-xs backdrop-blur-md flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-white animate-pulse" />
                        Prêt à emménager
                      </span>
                    </div>

                    {/* Bouton Coup de cœur (Favori) */}
                    <button
                      onClick={(e) => toggleFavorite(bien.id, e)}
                      title={isFav ? "Retirer de mes coups de cœur" : "Ajouter à mes coups de cœur"}
                      className={`absolute top-4 right-4 size-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all duration-200 ${
                        isFav
                          ? "bg-rose-500 text-white scale-110"
                          : "bg-white/90 hover:bg-white text-stone-700 hover:text-rose-500 hover:scale-105"
                      }`}
                    >
                      <Heart className={`size-4 ${isFav ? "fill-white" : ""}`} />
                    </button>

                    {/* Nombre de photos si disponible */}
                    {bien.photos && bien.photos.length > 1 && (
                      <div className="absolute bottom-3 right-4 bg-black/60 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        {bien.photos.length} photos
                      </div>
                    )}
                  </div>

                  {/* Corps de la carte */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Type de bien & Réf */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
                        <Tag className="size-3" />
                        {typeLabel}
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">
                        Réf. #{bien.id}
                      </span>
                    </div>

                    {/* Titre chaleureux */}
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">
                      {bien.titre}
                    </h3>

                    {/* Adresse avec icône douce */}
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mb-4 line-clamp-1">
                      <MapPin className="size-3.5 text-blue-600 shrink-0" />
                      <span>{bien.adresse}</span>
                    </p>

                    {/* Caractéristiques (Surface & Pièces) */}
                    <div className="grid grid-cols-2 gap-2.5 py-3 px-3.5 bg-[#FAF7F2] rounded-2xl mb-5 text-xs text-stone-600 border border-[#EDE6DC]/70">
                      <div className="flex items-center gap-2">
                        <Maximize2 className="size-4 text-stone-400" />
                        <span>
                          <strong className="text-stone-800">{bien.surface}</strong> m² habitables
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DoorOpen className="size-4 text-stone-400" />
                        <span>
                          {bien.nombre_pieces ? (
                            <>
                              <strong className="text-stone-800">{bien.nombre_pieces}</strong> pièce(s)
                            </>
                          ) : (
                            <span className="text-stone-400">Espace modulable</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Ligne Prix + Action bouton bleu élégant */}
                    <div className="mt-auto pt-4 border-t border-[#EDE6DC] flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[11px] text-stone-400 font-medium">
                          {isLocation ? "Loyer mensuel" : "Prix d'acquisition"}
                        </span>
                        <div className="text-lg font-black text-blue-600 group-hover:text-blue-700 transition-colors">
                          {formattedPrice}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openBienDetail(bien)
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md"
                      >
                        <span>Découvrir</span>
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
      <section className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-amber-50/50 border-t border-b border-[#EDE6DC] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-stone-900">
              Besoin d&apos;aide pour trouver votre coup de cœur ?
            </h3>
            <p className="text-sm text-stone-600 max-w-xl">
              Nos conseillers locaux vous guident à chaque étape pour visiter, louer ou acheter en toute sérénité et sans stress.
            </p>
          </div>
          <Link
            href="/inscription"
            className="shrink-0 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all duration-200 hover:scale-105"
          >
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>

      {/* =========================================================================
          5. MODAL DÉTAILS D'UN BIEN : LIVRE D'ACCUEIL CHALEUREUX
      ========================================================================= */}
      {selectedBien && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#EDE6DC] my-8">
            {/* Bouton Fermer */}
            <button
              onClick={closeBienDetail}
              className="absolute top-4 right-4 z-20 size-10 rounded-full bg-white/90 hover:bg-white text-stone-700 flex items-center justify-center shadow-md transition-all duration-150 hover:scale-105"
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-150"
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-150"
                      >
                        <ChevronRight className="size-5" />
                      </button>
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                        {selectedBien.photos.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPhotoIdx(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
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
                  <span className="text-sm">Photos complémentaires en cours d&apos;arrivée</span>
                </div>
              )}

              {/* Badges sur l'image du modal */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                  {selectedBien.mode_transaction === "LOCATION" ? "À louer" : "À acquérir"}
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                  Prêt à emménager
                </span>
              </div>
            </div>

            {/* Contenu du Modal */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
                    {getTypeBienLabel(selectedBien.type)}
                  </span>
                  <h2 className="text-2xl font-extrabold text-stone-900 mt-2">
                    {selectedBien.titre}
                  </h2>
                  <p className="text-sm text-stone-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="size-4 text-blue-600 shrink-0" />
                    <span>{selectedBien.adresse}</span>
                  </p>
                </div>
                <div className="sm:text-right shrink-0 bg-[#FAF7F2] sm:bg-transparent p-3 sm:p-0 rounded-2xl">
                  <span className="text-xs text-stone-400 uppercase font-semibold block">
                    {selectedBien.mode_transaction === "LOCATION" ? "Loyer mensuel" : "Prix de vente"}
                  </span>
                  <span className="text-2xl font-black text-blue-600">
                    {formatPrixBien(selectedBien)}
                  </span>
                </div>
              </div>

              {/* Fiche des caractéristiques */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-[#FAF7F2] rounded-2xl my-5 text-center border border-[#EDE6DC]">
                <div className="border-r border-[#EDE6DC] pr-2">
                  <span className="text-xs text-stone-500 block">Surface</span>
                  <span className="text-base font-bold text-stone-900">
                    {selectedBien.surface} m²
                  </span>
                </div>
                <div className="border-r border-[#EDE6DC] pr-2">
                  <span className="text-xs text-stone-500 block">Pièces</span>
                  <span className="text-base font-bold text-stone-900">
                    {selectedBien.nombre_pieces ? `${selectedBien.nombre_pieces} pièces` : "Libre"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">Projet</span>
                  <span className="text-base font-bold text-stone-900">
                    {selectedBien.mode_transaction === "LOCATION" ? "Location" : "Vente"}
                  </span>
                </div>
              </div>

              {/* Phrase bienveillante */}
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 mb-6">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>
                  Ce bien est vérifié par nos équipes. Vous pouvez poser une option ou planifier une visite en quelques clics.
                </span>
              </div>

              {/* Actions de réservation / visite */}
              <div className="pt-4 border-t border-[#EDE6DC] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={closeBienDetail}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Continuer à explorer
                </button>

                {currentUser ? (
                  <Link
                    href="/locataire/biens"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <span>Poser une option / Réserver</span>
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/login?redirect=${encodeURIComponent("/locataire/biens")}`}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <LogIn className="size-4" />
                    <span>Se connecter pour réserver</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MODAL CONDITIONS GÉNÉRALES D'UTILISATION (CGU)
      ========================================================================= */}
      {showCguModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#EDE6DC] overflow-hidden my-8">
            {/* Header modal CGU */}
            <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 rounded-xl bg-blue-50 text-blue-600 items-center justify-center">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Conditions Générales d&apos;Utilisation
                  </h3>
                  <p className="text-xs text-stone-500">
                    Engagements, transparence et sécurité sur ImmoConnect
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCguModal(false)}
                className="size-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Contenu textuel CGU */}
            <div className="p-6 sm:p-8 space-y-5 text-xs text-stone-600 max-h-[60vh] overflow-y-auto leading-relaxed">
              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  1. Objet et Mission d&apos;ImmoConnect
                </h4>
                <p>
                  ImmoConnect est une plateforme collaborative de gestion et d&apos;exploration immobilière. Elle vise à simplifier la relation entre locataires, propriétaires et agents grâce à un suivi clair, transparent et humain de chaque dossier.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <Key className="size-4 text-blue-600" />
                  2. Engagements des Utilisateurs
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>Locataires :</strong> Fournir des informations authentiques et honorer les échéances convenues dans le cadre des baux établis.</li>
                  <li><strong>Propriétaires :</strong> Garantir l&apos;exactitude des descriptions et photographies des biens mis à disposition.</li>
                  <li><strong>Agents & Administrateurs :</strong> Assurer une médiation impartiale et la validation rigoureuse des pièces justificatives.</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-indigo-600" />
                  3. Sécurité des Données et Confidentialité
                </h4>
                <p>
                  Vos documents personnels (pièces d&apos;identité, quittances, justificatifs) sont chiffrés et hébergés en conformité avec les réglementations de protection des données (RGPD). Aucune donnée n&apos;est cédée à des tiers à des fins publicitaires.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <HelpCircle className="size-4 text-amber-600" />
                  4. Réservations et Visites
                </h4>
                <p>
                  La réservation d&apos;un bien via la plateforme constitue une demande de mise en relation prioritaire et ne remplace pas la signature formelle d&apos;un bail ou acte de vente validé par les deux parties.
                </p>
              </section>
            </div>

            {/* Footer modal CGU */}
            <div className="px-6 sm:px-8 py-4 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setShowCguModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                J&apos;ai compris et j&apos;accepte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. FOOTER CHALEUREUX & HARMONIEUX
      ========================================================================= */}
      <footer className="mt-auto bg-white border-t border-[#EDE6DC] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Home className="size-4" />
            </div>
            <div>
              <span className="font-bold text-stone-800">ImmoConnect</span>
              <span className="text-stone-400 ml-2">— Des projets de vie menés avec cœur.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => setShowCguModal(true)}
              className="hover:text-blue-600 transition-colors"
            >
              Conditions d&apos;utilisation
            </button>
            <Link href="/login" className="hover:text-blue-600 transition-colors">
              Espace Client
            </Link>
            <Link href="/inscription" className="hover:text-blue-600 transition-colors">
              Créer un compte
            </Link>
            <span>&copy; {new Date().getFullYear()} ImmoConnect. Tous droits réservés.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
