export interface Contrat {
  id: number
  bien: number
  bien_titre?: string
  bien_type?: string
  locataire: number
  locataire_user_id?: number
  locataire_nom?: string
  locataire_prenoms?: string
  proprietaire_user_id?: number | null
  proprietaire_nom?: string | null
  type_contrat: "LOCATION" | "ACHAT"
  type_paiement_achat?: "TOTALITE" | "PARTIEL" | null
  date_debut?: string | null
  date_fin?: string | null
  date_paiement?: string | null
  loyer: string | null
  depot_garantie?: string | null
  prix?: string | null
  statut: string
  document_pdf?: string | null
  date_creation?: string
}

export interface CreerContratPayload {
  bien: number
  locataire: number
  type_contrat: "LOCATION" | "ACHAT"
  type_paiement_achat?: "TOTALITE" | "PARTIEL" | null
  date_debut?: string | null
  date_fin?: string | null
  loyer?: string | null
  depot_garantie?: string | null
  prix?: string | null
}
