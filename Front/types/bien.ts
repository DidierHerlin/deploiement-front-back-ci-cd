export type BienType = "APPARTEMENT" | "MAISON" | "LOCAL_COMMERCIAL" | "COMMERCE" | "BUREAU" | "TERRAIN"
export type ModeTransaction = "LOCATION" | "VENTE"
export type StatutBien = "DISPONIBLE" | "LOUE" | "VENDU" | "EN_TRAVAUX" | "RESERVE"

export interface BienProprietaire {
  id: number
  nom?: string
  prenoms?: string
  email?: string
  user?: {
    id?: number
    nom: string
    prenoms: string
    email?: string
  }
}

export interface Bien {
  id: number
  titre: string
  type: BienType | string
  mode_transaction: ModeTransaction | string
  adresse: string
  surface: number
  nombre_pieces: number | null
  loyer_mensuel: string | null
  prix: string | null
  statut: StatutBien | string
  photos: string[]
  photo_cover?: string | null
  proprietaire?: BienProprietaire | { id: number; user: { id: number; email: string; nom: string; prenoms: string } } | null
}

export interface BienListItem {
  id: number
  titre: string
  type: string
  mode_transaction: ModeTransaction | "LOCATION" | "VENTE"
  adresse: string
  surface?: number | null
  nombre_pieces?: number | null
  loyer_mensuel: string | null
  prix: string | null
  statut: string
  photos?: string[] | null
  photo_cover?: string | null
  proprietaire?: { id: number; user: { id?: number; nom: string; prenoms: string } }
}

export interface BienInfo {
  loyer_mensuel: string | null
  prix: string | null
  mode_transaction: "LOCATION" | "VENTE"
  type: string
  surface: number
  adresse: string
  titre: string
}

export interface BienFilters {
  search?: string
  type?: string
  mode_transaction?: string
  statut?: string
}
