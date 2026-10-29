import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import React, { ReactNode } from "react"
import { LanguageProvider, useTranslation } from "./i18n"

describe("i18n System", () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = "immoconnect_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.documentElement.lang = "fr"
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <LanguageProvider>{children}</LanguageProvider>
  )

  it("permet de basculer la langue vers le français ('fr') et l'anglais ('en')", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })

    act(() => {
      result.current.setLang("fr")
    })
    expect(result.current.lang).toBe("fr")
    expect(result.current.t("nav.sign_in")).toBe("Se connecter")
    expect(result.current.t("auth.login.welcome_back")).toBe("Bon retour !")
    expect(result.current.t("dashboard.nav.overview")).toBe("Vue d'ensemble")
    expect(localStorage.getItem("immoconnect_lang")).toBe("fr")
    expect(document.documentElement.lang).toBe("fr")
    expect(document.cookie).toContain("immoconnect_lang=fr")

    act(() => {
      result.current.setLang("en")
    })
    expect(result.current.lang).toBe("en")
    expect(result.current.t("nav.sign_in")).toBe("Sign in")
    expect(result.current.t("auth.login.welcome_back")).toBe("Welcome back!")
    expect(result.current.t("dashboard.nav.overview")).toBe("Overview")
    expect(localStorage.getItem("immoconnect_lang")).toBe("en")
    expect(document.documentElement.lang).toBe("en")
    expect(document.cookie).toContain("immoconnect_lang=en")
  })

  it("respecte la langue sauvegardée dans le localStorage", () => {
    localStorage.setItem("immoconnect_lang", "fr")
    const { result } = renderHook(() => useTranslation(), { wrapper })

    expect(result.current.lang).toBe("fr")
    expect(result.current.t("nav.sign_in")).toBe("Se connecter")
  })

  it("renvoie la clé ou le fallback si la traduction n'existe pas", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })

    expect(result.current.t("cle.inexistante")).toBe("cle.inexistante")
    expect(result.current.t("cle.inexistante", "Fallback Valeur")).toBe("Fallback Valeur")
  })

  it("prend en charge les paramètres d'interpolation dynamiques", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })

    act(() => {
      result.current.setLang("fr")
    })
    expect(result.current.t("search.want_to", { test: "123" })).toBe("Filtres :")

    act(() => {
      result.current.setLang("en")
    })
    expect(result.current.t("search.want_to", { test: "123" })).toBe("Filters :")
  })
})
