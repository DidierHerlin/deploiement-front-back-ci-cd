"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"
import frMessages from "@/locales/fr.json"
import enMessages from "@/locales/en.json"
import { Globe, ChevronDown } from "lucide-react"

export type Language = "fr" | "en"

type Messages = typeof frMessages

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (path: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string
  messages: Messages
}

const dictionaries: Record<Language, Messages> = {
  fr: frMessages,
  en: enMessages,
}

export function getInitialLanguage(): Language {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("immoconnect_lang") as Language | null
      if (saved === "fr" || saved === "en") return saved
      const cookieMatch = document.cookie.match(/(?:^|;\s*)immoconnect_lang=(fr|en)/)
      if (cookieMatch) return cookieMatch[1] as Language
      if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) {
        return "en"
      }
    } catch {
      // ignore
    }
  }
  return "fr"
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "fr",
  setLang: () => {},
  t: (path: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => {
    if (typeof paramsOrFallback === "string") return paramsOrFallback
    return fallback || path
  },
  messages: frMessages,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("fr")

  useEffect(() => {
    const initial = getInitialLanguage()
    setLangState(initial)
    if (typeof document !== "undefined") {
      document.documentElement.lang = initial
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    try {
      localStorage.setItem("immoconnect_lang", newLang)
      document.cookie = `immoconnect_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLang
      }
    } catch {
      // Ignorer si stockage inaccessible
    }
  }

  // Fonction de traduction accédant aux clés imbriquées (ex: "dashboard.nav.overview")
  const t = (
    path: string,
    paramsOrFallback?: Record<string, string | number> | string,
    fallback?: string
  ): string => {
    let resolvedFallback = fallback
    let params: Record<string, string | number> | undefined

    if (typeof paramsOrFallback === "string") {
      resolvedFallback = paramsOrFallback
    } else if (typeof paramsOrFallback === "object" && paramsOrFallback !== null) {
      params = paramsOrFallback
    }

    const resolveKey = (dict: any, p: string): any => {
      const keys = p.split(".")
      let cur = dict
      for (const k of keys) {
        if (cur && typeof cur === "object" && k in cur) {
          cur = cur[k]
        } else {
          return undefined
        }
      }
      return typeof cur === "string" ? cur : undefined
    }

    let text = resolveKey(dictionaries[lang], path)
    if (!text && lang !== "fr") {
      text = resolveKey(dictionaries["fr"], path)
    }
    if (!text) {
      text = resolvedFallback || path
    }

    if (params && typeof text === "string") {
      for (const [key, val] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, "g"), String(val))
      }
    }

    return text
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, messages: dictionaries[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return context
}

export interface LanguageSwitcherProps {
  className?: string
  variant?: "default" | "compact" | "transparent" | "dark"
}

/**
 * Sélecteur de langue discret, élégant et persistant pour toutes les barres de navigation et headers.
 */
export function LanguageSwitcher({ className = "", variant = "default" }: LanguageSwitcherProps) {
  const { lang, setLang } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const languages = [
    { code: "fr" as Language, label: "Français", flag: "🇫🇷", short: "FR" },
    { code: "en" as Language, label: "English", flag: "🇬🇧", short: "EN" },
  ]

  const current = languages.find((l) => l.code === lang) || languages[0]

  let buttonStyle = "px-2.5 py-1.5 rounded-xl border border-stone-200/90 bg-white/90 text-stone-700 hover:text-blue-600 hover:border-blue-200 text-xs font-semibold shadow-2xs hover:bg-stone-50"
  if (variant === "compact") {
    buttonStyle = "px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-blue-600 text-xs font-medium"
  } else if (variant === "transparent") {
    buttonStyle = "px-2.5 py-1.5 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold backdrop-blur-md"
  } else if (variant === "dark") {
    buttonStyle = "px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold"
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        title="Changer de langue / Change language"
        className={`flex items-center gap-1.5 transition-all cursor-pointer ${buttonStyle}`}
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="tracking-wide uppercase font-bold text-[11px]">{current.short}</span>
        <ChevronDown className={`size-3 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-2xl shadow-xl shadow-stone-300/40 border border-[#EDE6DC] py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {languages.map((l) => {
            const isSelected = l.code === lang
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-stone-700 hover:bg-stone-50 hover:text-blue-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">{l.flag}</span>
                  <span>{l.label}</span>
                </span>
                {isSelected && <span className="size-1.5 rounded-full bg-blue-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
