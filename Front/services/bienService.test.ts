import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  fetchBiensDisponibles,
  formatPrixBien,
  getTypeBienLabel,
  getPhotoBienUrl,
  type Bien,
} from "./bienService"

describe("bienService", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("formatPrixBien", () => {
    it("formate correctement le loyer mensuel en location", () => {
      const bien: Bien = {
        id: 1,
        titre: "Studio T1",
        type: "APPARTEMENT",
        mode_transaction: "LOCATION",
        adresse: "Antananarivo",
        surface: 35,
        nombre_pieces: 1,
        loyer_mensuel: "450000.00",
        prix: null,
        statut: "DISPONIBLE",
        photos: [],
      }
      expect(formatPrixBien(bien)).toContain("450")
      expect(formatPrixBien(bien)).toContain("Ar / mois")
    })

    it("formate correctement le prix de vente", () => {
      const bien: Bien = {
        id: 2,
        titre: "Villa F4",
        type: "MAISON",
        mode_transaction: "VENTE",
        adresse: "Ivato",
        surface: 180,
        nombre_pieces: 4,
        loyer_mensuel: null,
        prix: "280000000.00",
        statut: "DISPONIBLE",
        photos: [],
      }
      expect(formatPrixBien(bien)).toContain("280")
      expect(formatPrixBien(bien)).toContain("Ar")
      expect(formatPrixBien(bien)).not.toContain("/ mois")
    })
  })

  describe("getTypeBienLabel", () => {
    it("traduit les types de bien en libellés lisibles", () => {
      expect(getTypeBienLabel("APPARTEMENT")).toBe("Appartement")
      expect(getTypeBienLabel("MAISON")).toBe("Maison")
      expect(getTypeBienLabel("LOCAL_COMMERCIAL")).toBe("Local commercial")
      expect(getTypeBienLabel("TERRAIN")).toBe("Terrain")
    })
  })

  describe("getPhotoBienUrl", () => {
    it("retourne l'URL de la première photo", () => {
      const bien: Bien = {
        id: 3,
        titre: "Local",
        type: "LOCAL_COMMERCIAL",
        mode_transaction: "LOCATION",
        adresse: "Centre-ville",
        surface: 60,
        nombre_pieces: null,
        loyer_mensuel: "1200000",
        prix: null,
        statut: "DISPONIBLE",
        photos: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
      }
      expect(getPhotoBienUrl(bien)).toBe("https://example.com/photo1.jpg")
    })
  })

  describe("fetchBiensDisponibles", () => {
    it("effectue un appel fetch et retourne la liste des biens", async () => {
      const mockBiens: Bien[] = [
        {
          id: 1,
          titre: "Bel Appartement",
          type: "APPARTEMENT",
          mode_transaction: "LOCATION",
          adresse: "Analakely",
          surface: 50,
          nombre_pieces: 2,
          loyer_mensuel: "600000",
          prix: null,
          statut: "DISPONIBLE",
          photos: [],
        },
      ]

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: mockBiens }),
      } as Response)

      const result = await fetchBiensDisponibles({
        search: "Analakely",
        mode_transaction: "LOCATION",
      })

      expect(fetchSpy).toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0].titre).toBe("Bel Appartement")
    })

    it("lève une erreur si la requête échoue avec un code HTTP 500", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      await expect(fetchBiensDisponibles()).rejects.toThrow(/Erreur HTTP 500/)
    })
  })
})
