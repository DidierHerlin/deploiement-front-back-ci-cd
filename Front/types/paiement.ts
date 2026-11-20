export interface DemandeEnCours {
  id: number
  statut: string
  moyen_paiement: string
  date_demande: string
  montant: string
  telephone?: string | null
  reference?: string | null
}

export interface Paiement {
  id: number
  contrat: number | { id: number; statut?: string; [key: string]: any }
  contrat_statut?: string
  locataire_user_id?: number
  locataire_id?: number
  num_echeance: number
  date_echeance: string
  date_paiement_prevue: string | null
  date_paiement: string | null
  date_versement_partiel: string | null
  montant_attendu: string | null
  montant: string | null
  montant_paye: string | null
  montant_restant: string | null
  mode_paiement: string | null
  reference: string | null
  statut: string
  est_partiel: boolean
  date_creation: string
  locataire_nom: string
  locataire_user_id?: number
  locataire_id?: number
  proprietaire_user_id?: number | null
  proprietaire_id?: number | null
  proprietaire_nom?: string | null
  bien_titre: string
  loyer_contrat: string
  type_contrat?: string
  prix_contrat?: string | null
  type_paiement_achat?: string | null
  est_en_retard: boolean
  message_mois: string
  part_proprietaire: number | null
  commission_agent: number | null
  est_mois_a_venir?: boolean
  a_echeance_anterieure_impayee?: boolean
  est_eligible_demande?: boolean
  demande_en_cours?: DemandeEnCours | null
}

export interface PaiementStatsData {
  total: number
  count_paye: number
  count_attente: number
  count_retard: number
  total_encaisse: number
  montant_restant: number
}

export interface DemandePaiement {
  id: number
  locataire: number
  locataire_nom: string
  locataire_email: string
  facture: number
  bien_titre: string
  date_echeance_facture: string
  mois_echeance_facture: string
  statut_facture: string
  montant: string
  date_demande: string
  moyen_paiement: "MVOLA" | "ORANGE_MONEY" | "AIRTEL_MONEY"
  statut: "EN_ATTENTE" | "VALIDE" | "REFUSE" | "ANNULE"
  statut_display?: string
  telephone: string | null
  reference: string | null
  date_traitement: string | null
  motif_refus: string | null
}

export interface CreerDemandePaiementPayload {
  facture: number
  montant?: number | string
  moyen_paiement: "MVOLA" | "ORANGE_MONEY" | "AIRTEL_MONEY"
  telephone?: string
  reference?: string
}
