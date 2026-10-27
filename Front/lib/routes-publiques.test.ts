import { describe, it, expect } from "vitest"
import { estPublique, CHEMINS_PUBLICS } from "./routes-publiques"

describe("routes-publiques", () => {
  it("contient '/' dans les chemins publics", () => {
    expect(CHEMINS_PUBLICS).toContain("/")
  })

  it("autorise la racine '/' en tant que route publique", () => {
    expect(estPublique("/")).toBe(true)
  })

  it("autorise les pages de connexion et d'inscription", () => {
    expect(estPublique("/login")).toBe(true)
    expect(estPublique("/connexion")).toBe(true)
    expect(estPublique("/inscription")).toBe(true)
    expect(estPublique("/mot-de-passe-oublie")).toBe(true)
  })

  it("ne traite PAS les routes protégées comme publiques", () => {
    expect(estPublique("/admin")).toBe(false)
    expect(estPublique("/admin/dashboard")).toBe(false)
    expect(estPublique("/locataire/dashboard")).toBe(false)
    expect(estPublique("/locataire/biens")).toBe(false)
    expect(estPublique("/agent/dashboard")).toBe(false)
    expect(estPublique("/proprietaire/dashboard")).toBe(false)
  })
})
