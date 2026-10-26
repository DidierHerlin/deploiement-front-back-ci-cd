import { getApiUrl } from "@/lib/config"
import { getAccessToken, isTokenValid } from "@/lib/auth"
import { resolveMediaUrl } from "@/lib/api"

export type BienType = "APPARTEMENT" | "MAISON" | "LOCAL_COMMERCIAL" | "TERRAIN"
export type ModeTransaction = "LOCATION" | "VENTE"
export type StatutBien = "DISPONIBLE" | "LOUE" | "VENDU" | "EN_TRAVAUX" | "RESERVE"

export interface Bien {
  id: number
  titre: string
  type: BienType | string
  mode_transaction: ModeTransaction
  adresse: string
  surface: number
  nombre_pieces: number | null
  loyer_mensuel: string | null
  prix: string | null
  statut: StatutBien | string
  photos: string[]
  photo_cover?: string | null
  proprietaire?: {
    id: number
    nom?: string
    prenoms?: string
    email?: string
    user?: {
      id?: number
      nom?: string
      prenoms?: string
      email?: string
    }
  } | null
}

export interface BienFilters {
  search?: string
  type?: string
  mode_transaction?: string
}

/**
 * Récupère les biens disponibles depuis l'API backend de manière sécurisée et typée.
 * Accès public : ne bloque pas si l'utilisateur n'est pas authentifié.
 */
export async function fetchBiensDisponibles(filters?: BienFilters): Promise<Bien[]> {
  const apiUrl = getApiUrl().replace(/\/+$/, "")
  const params = new URLSearchParams()

  if (filters?.search && filters.search.trim()) {
    params.append("search", filters.search.trim())
  }
  if (filters?.type && filters.type !== "Tous" && filters.type !== "TOUS") {
    params.append("type", filters.type)
  }
  if (filters?.mode_transaction && filters.mode_transaction !== "Tous" && filters.mode_transaction !== "TOUS") {
    params.append("mode_transaction", filters.mode_transaction)
  }

  const query = params.toString() ? `?${params.toString()}` : ""
  const endpoint = `${apiUrl}/biens/disponibles/${query}`

  const token = getAccessToken()
  const headers: HeadersInit = {
    Accept: "application/json",
  }
  if (token && isTokenValid(token)) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    let response = await fetch(endpoint, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    // Fallback gracieux si l'URL au pluriel n'est pas disponible
    if (response.status === 404) {
      response = await fetch(`${apiUrl}/biens/disponible/${query}`, {
        method: "GET",
        headers,
        cache: "no-store",
      })
    }

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status} lors de la récupération des biens disponibles.`)
    }

    const data = await response.json()

    let items: Bien[] = []
    if (Array.isArray(data)) {
      items = data
    } else if (data && Array.isArray(data.results)) {
      items = data.results
    } else if (data && Array.isArray(data.data)) {
      items = data.data
    }

    return items
  } catch (error: any) {
    console.error("Erreur dans fetchBiensDisponibles :", error)
    throw error
  }
}

/**
 * Formate le prix d'un bien de façon claire et lisible (supporte FR et EN).
 * Ex: "1 500 000 Ar / mois" (FR) ou "1,500,000 Ar / month" (EN).
 */
export function formatPrixBien(bien: Bien, lang: "fr" | "en" = "fr"): string {
  const locale = lang === "en" ? "en-US" : "fr-FR"
  if (bien.mode_transaction === "LOCATION") {
    const montant = bien.loyer_mensuel ? Number(bien.loyer_mensuel) : 0
    const suffix = lang === "en" ? "Ar / month" : "Ar / mois"
    return `${montant.toLocaleString(locale)} ${suffix}`
  }
  const montant = bien.prix ? Number(bien.prix) : 0
  return `${montant.toLocaleString(locale)} Ar`
}

/**
 * Libellé lisible pour le type de bien (supporte FR et EN).
 */
export function getTypeBienLabel(type: string, lang: "fr" | "en" = "fr"): string {
  switch (type?.toUpperCase()) {
    case "APPARTEMENT":
      return lang === "en" ? "Apartment" : "Appartement"
    case "MAISON":
      return lang === "en" ? "House" : "Maison"
    case "LOCAL_COMMERCIAL":
      return lang === "en" ? "Commercial space" : "Local commercial"
    case "TERRAIN":
      return lang === "en" ? "Land" : "Terrain"
    default:
      return type || (lang === "en" ? "Property" : "Bien")
  }
}

/**
 * Récupère l'URL de la première photo du bien résolue proprement.
 */
export function getPhotoBienUrl(bien: Bien): string | null {
  const photo = (bien.photos && bien.photos.length > 0) ? bien.photos[0] : bien.photo_cover
  return resolveMediaUrl(photo)
}
