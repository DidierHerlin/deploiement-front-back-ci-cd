"use client"

import React, { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop, ChevronDown, Check } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export interface ThemeToggleProps {
  className?: string
  variant?: "default" | "compact"
}

export function ThemeToggle({ className = "", variant = "default" }: ThemeToggleProps) {
  const { theme, setTheme, systemTheme } = useTheme()
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const themeOptions = [
    {
      id: "light",
      label: t("settings.theme_light_title", "Clair (Normal)"),
      shortLabel: "Clair",
      icon: Sun,
    },
    {
      id: "dark",
      label: t("settings.theme_dark_title", "Sombre (Dark)"),
      shortLabel: "Sombre",
      icon: Moon,
    },
    {
      id: "system",
      label: t("settings.theme_system_title", "Système (Auto)"),
      shortLabel: "Système",
      icon: Laptop,
    },
  ]

  if (!mounted) {
    return (
      <div className={`relative inline-block ${className}`}>
        <div className="px-2.5 py-1.5 rounded-xl border border-stone-200/90 bg-white/90 text-stone-700 text-xs font-semibold shadow-2xs opacity-60">
          <Sun className="size-3.5 inline-block" />
        </div>
      </div>
    )
  }

  const currentOption = themeOptions.find((o) => o.id === theme) || themeOptions[2]
  const CurrentIcon = currentOption.icon

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        title="Mode d'affichage (Thème) / Display Theme"
        aria-label="Mode d'affichage (Thème)"
        className="flex items-center whitespace-nowrap shrink-0 gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200/90 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 text-stone-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 text-xs font-semibold shadow-2xs hover:bg-stone-50 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
      >
        <CurrentIcon className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
        <span className="tracking-wide font-medium text-[11px] hidden sm:inline whitespace-nowrap">{currentOption.shortLabel}</span>
        <ChevronDown className={`size-3 shrink-0 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-stone-300/40 dark:shadow-black/50 border border-[#EDE6DC] dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-stone-400 dark:text-slate-400 border-b border-stone-100 dark:border-slate-700 mb-1">
            {t("settings.theme_section_title", "Mode d'affichage")}
          </div>
          {themeOptions.map((opt) => {
            const isSelected = opt.id === theme
            const Icon = opt.icon
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setTheme(opt.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold"
                    : "text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700/60 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className={`size-4 ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-stone-400 dark:text-slate-400"}`} />
                  <span>{opt.label}</span>
                </span>
                {isSelected && <Check className="size-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
