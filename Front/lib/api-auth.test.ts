import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { isPublicAuthRoute, fetchAPI, demanderCodeMdp, verifierCodeMdp, reinitialiserMdp } from "./api"
import * as authModule from "./auth"

describe("api - skipAuth and public routes", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe("isPublicAuthRoute", () => {
    it("détecte correctement les routes publiques de mot de passe oublié", () => {
      expect(isPublicAuthRoute("/mot-de-passe/demande/")).toBe(true)
      expect(isPublicAuthRoute("/mot-de-passe/verifier-code/")).toBe(true)
      expect(isPublicAuthRoute("/mot-de-passe/verifier/")).toBe(true)
      expect(isPublicAuthRoute("/mot-de-passe/reinitialiser/")).toBe(true)
      expect(isPublicAuthRoute("/mot-de-passe/confirmer/")).toBe(true)
    })

    it("détecte correctement les routes de connexion et d'inscription", () => {
      expect(isPublicAuthRoute("/auth/login/")).toBe(true)
      expect(isPublicAuthRoute("/auth/signup/")).toBe(true)
      expect(isPublicAuthRoute("/locataires/register/")).toBe(true)
      expect(isPublicAuthRoute("/proprietaires/register/")).toBe(true)
    })

    it("ne traite PAS les routes protégées comme publiques", () => {
      expect(isPublicAuthRoute("/profil/changer-mot-de-passe/")).toBe(false)
      expect(isPublicAuthRoute("/admin/dashboard/")).toBe(false)
      expect(isPublicAuthRoute("/locataires/me/")).toBe(false)
      expect(isPublicAuthRoute("/paiements/")).toBe(false)
    })
  })

  describe("fetchAPI avec skipAuth ou route publique", () => {
    it("n'exige pas de token et n'envoie pas le header Authorization même avec un token expiré en localStorage", async () => {
      // Simuler un ancien token expiré dans localStorage
      localStorage.setItem("access_token", "expired_token_12345")
      localStorage.setItem("refresh_token", "expired_refresh_12345")

      let capturedHeaders: HeadersInit | undefined

      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        capturedHeaders = init?.headers
        return new Response(JSON.stringify({ success: true, message: "Code envoyé" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      })

      // Appel à une route publique avec skipAuth
      const res = await demanderCodeMdp("test@example.com")
      expect(res).toEqual({ success: true, message: "Code envoyé" })

      // Vérifier que le header Authorization n'a PAS été injecté
      const headersRecord = capturedHeaders as Record<string, string>
      expect(headersRecord["Authorization"]).toBeUndefined()
    })

    it("ne déclenche pas l'expiration de session lors d'une erreur 401 sur une route publique", async () => {
      global.fetch = vi.fn().mockImplementation(async () => {
        return new Response(JSON.stringify({ error: "Code invalide ou expiré." }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      })

      const rafraichirSpy = vi.spyOn(authModule, "rafraichirToken")

      // L'appel doit lever l'erreur de l'API et non "Votre session a expiré"
      await expect(verifierCodeMdp("test@example.com", "999999")).rejects.toThrow(
        "Code invalide ou expiré."
      )

      // Le refresh token ne doit pas avoir été tenté
      expect(rafraichirSpy).not.toHaveBeenCalled()
    })

    it("sur une route protégée sans token valide, bloque et lève l'erreur de session expirée", async () => {
      // Pas de token dans localStorage
      await expect(fetchAPI("/paiements/")).rejects.toThrow("Votre session a expiré")
    })

    it("reinitialiserMdp envoie les alias new_password et nouveau_mot_de_passe ainsi que code et token", async () => {
      let capturedBody: string | undefined

      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        capturedBody = init?.body as string
        return new Response(JSON.stringify({ success: true, message: "Mot de passe réinitialisé" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      })

      await reinitialiserMdp({
        email: "user@example.com",
        code: "123456",
        nouveau_mot_de_passe: "Test@2026/**..",
        confirmation_mot_de_passe: "Test@2026/**..",
      })

      expect(capturedBody).toBeDefined()
      const parsed = JSON.parse(capturedBody!)
      expect(parsed.email).toBe("user@example.com")
      expect(parsed.code).toBe("123456")
      expect(parsed.token).toBe("123456")
      expect(parsed.new_password).toBe("Test@2026/**..")
      expect(parsed.nouveau_mot_de_passe).toBe("Test@2026/**..")
      expect(parsed.confirm_password).toBe("Test@2026/**..")
    })
  })
})
