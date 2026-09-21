"use client"

/**
 * Formulaire de création de contrat — Agent / Admin
 *
 * Comportement clé :
 * - À la sélection d'un Bien, un appel GET /api/biens/{id}/ est déclenché
 *   pour récupérer le détail complet, notamment `loyer_mensuel`.
 * - Le champ « Loyer mensuel » est pré-rempli automatiquement avec la valeur
 *   retournée par l'API ; l'utilisateur peut ensuite la modifier.
 * - Le champ « Dépôt de garantie » est pré-rempli à 2× le loyer.
 * - Pour un contrat ACHAT, le champ « Prix » est pré-rempli depuis `bien.prix`.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  getBiensDisponibles,
  getBienInfo,
  getLocataires,
  creerContrat,
  type BienListItem,
  type BienInfo,
  type Locataire,
  type CreerContratPayload,
} from "@/lib/api"

// ─── Valeurs initiales du formulaire ────────────────────────────────────────

const FORM_INITIAL = {
  bien_id: "",
  locataire_id: "",
  type_contrat: "LOCATION" as "LOCATION" | "ACHAT",
  type_paiement_achat: "TOTALITE" as "TOTALITE" | "PARTIEL",
  date_debut: "",
  date_fin: "",
  loyer: "",
  depot_garantie: "",
  prix: "",
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Formate un nombre décimal en chaîne lisible (ex: "500 000") */
function formaterMontant(valeur: string | null | undefined): string {
  if (!valeur) return ""
  const n = parseFloat(valeur)
  if (isNaN(n)) return ""
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
}

/** Convertit une chaîne formatée en nombre décimal brut pour l'API */
function nettoyerMontant(valeur: string): string {
  // Supprime les espaces (séparateurs de milliers français) et remplace virgule par point
  return valeur.replace(/\s/g, "").replace(",", ".")
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function NouveauContratPage() {
  const router = useRouter()

  // Données du formulaire
  const [form, setForm] = useState(FORM_INITIAL)

  // Listes de sélection
  const [biens, setBiens] = useState<BienListItem[]>([])
  const [locataires, setLocataires] = useState<Locataire[]>([])

  // Détail du bien sélectionné (récupéré depuis l'API /contrats/bien_info/)
  const [bienSelectionne, setBienSelectionne] = useState<BienInfo | null>(null)

  // États UI
  const [chargementBien, setChargementBien] = useState(false)
  const [chargementSoumission, setChargementSoumission] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState(false)

  // ── Chargement initial des listes ────────────────────────────────────────

  useEffect(() => {
    async function chargerDonnees() {
      try {
        const [biensData, locatairesData] = await Promise.all([
          getBiensDisponibles(),
          getLocataires(),
        ])
        setBiens(biensData)
        setLocataires(locatairesData)
      } catch (e) {
        setErreur(
          e instanceof Error
            ? e.message
            : "Erreur lors du chargement des données."
        )
      }
    }
    chargerDonnees()
  }, [])

  // ── Sélection d'un Bien → récupération du loyer_mensuel ─────────────────

  async function handleBienChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const bienId = e.target.value
    setForm((f) => ({
      ...f,
      bien_id: bienId,
      // Réinitialiser les champs financiers lors du changement de bien
      loyer: "",
      depot_garantie: "",
      prix: "",
    }))
    setBienSelectionne(null)

    if (!bienId) return

    setChargementBien(true)
    setErreur(null)
    try {
      /**
       * ⚡ Appel clé : GET /api/contrats/bien_info/?bien_id={id}
       *
       * Endpoint dédié du ContratViewSet qui retourne directement :
       * { loyer_mensuel, prix, mode_transaction, type, surface, adresse, titre }
       *
       * Pourquoi ce champ était vide avant :
       * Le formulaire React n'appelait pas l'API pour récupérer le loyer_mensuel
       * lors de la sélection du bien. Ce problème est résolu ici.
       */
      const detail = await getBienInfo(parseInt(bienId, 10))
      setBienSelectionne(detail)

      // Détecter le type de contrat selon le mode de transaction du bien
      const typeContrat =
        detail.mode_transaction === "VENTE" ? "ACHAT" : "LOCATION"

      if (typeContrat === "LOCATION" && detail.loyer_mensuel) {
        const loyer = parseFloat(detail.loyer_mensuel)
        setForm((f) => ({
          ...f,
          type_contrat: "LOCATION",
          // ✅ Pré-remplissage automatique du loyer depuis le bien
          loyer: formaterMontant(detail.loyer_mensuel),
          // Dépôt de garantie = 2× loyer (valeur par défaut métier)
          depot_garantie: formaterMontant(String(loyer * 2)),
          prix: "",
        }))
      } else if (typeContrat === "ACHAT" && detail.prix) {
        setForm((f) => ({
          ...f,
          type_contrat: "ACHAT",
          loyer: "",
          depot_garantie: "",
          // ✅ Pré-remplissage automatique du prix depuis le bien
          prix: formaterMontant(detail.prix),
        }))
      }
    } catch (e) {
      setErreur(
        e instanceof Error
          ? e.message
          : "Impossible de récupérer les informations de ce bien."
      )
    } finally {
      setChargementBien(false)
    }
  }

  // ── Gestion des champs génériques ────────────────────────────────────────

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  // ── Soumission du formulaire ──────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setChargementSoumission(true)

    try {
      const payload: CreerContratPayload = {
        bien: parseInt(form.bien_id, 10),
        locataire: parseInt(form.locataire_id, 10),
        type_contrat: form.type_contrat,
      }

      if (form.type_contrat === "LOCATION") {
        payload.date_debut = form.date_debut
        if (form.date_fin) payload.date_fin = form.date_fin
        if (form.loyer) payload.loyer = nettoyerMontant(form.loyer)
        if (form.depot_garantie)
          payload.depot_garantie = nettoyerMontant(form.depot_garantie)
      } else {
        payload.date_fin = null
        payload.date_debut = null
        payload.type_paiement_achat = form.type_paiement_achat
        if (form.prix) payload.prix = nettoyerMontant(form.prix)
      }

      await creerContrat(payload)
      setSucces(true)
      setTimeout(() => router.push("/agent/dashboard"), 2000)
    } catch (e) {
      setErreur(
        e instanceof Error ? e.message : "Erreur lors de la création du contrat."
      )
    } finally {
      setChargementSoumission(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  const isLocation = form.type_contrat === "LOCATION"

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <button type="button" onClick={() => router.back()} className="agent-back">
        ← Retour
      </button>
      <div className="panel">
        {/* En-tête */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Nouveau contrat
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Remplissez les informations ci-dessous. Les champs financiers
            sont pré-remplis automatiquement à la sélection du bien.
          </p>
        </div>

        {/* Message de succès */}
        {succes && (
          <div className="agent-info-box green">
            Contrat créé avec succès ! Redirection…
          </div>
        )}

        {/* Message d'erreur */}
        {erreur && (
          <div className="agent-info-box red" role="alert">
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── Sélection du Bien ── */}
          <div style={{ marginBottom: 18 }}>
            <label className="agent-field">Bien <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <select
              name="bien_id"
              value={form.bien_id}
              onChange={handleBienChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">— Sélectionnez un bien —</option>
              {biens.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.titre} — {b.adresse} ({b.mode_transaction})
                </option>
              ))}
            </select>

            {/* Indicateur de chargement lors de la récupération du bien */}
            {chargementBien && (
              <p className="mt-1 text-xs text-emerald-600 animate-pulse">
                Récupération des informations du bien…
              </p>
            )}

            {/* Résumé du bien sélectionné */}
            {bienSelectionne && !chargementBien && (
              <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                <p className="font-semibold">{bienSelectionne.titre}</p>
                <p>{bienSelectionne.adresse} · {bienSelectionne.surface} m²</p>
                {bienSelectionne.loyer_mensuel && (
                  <p>
                    Loyer mensuel enregistré :{" "}
                    <strong>
                      {formaterMontant(bienSelectionne.loyer_mensuel)} Ar
                    </strong>
                  </p>
                )}
                {bienSelectionne.prix && (
                  <p>
                    Prix de vente :{" "}
                    <strong>{formaterMontant(bienSelectionne.prix)} Ar</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Type de contrat ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de contrat <span className="text-red-500">*</span>
            </label>
            <select
              name="type_contrat"
              value={form.type_contrat}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="LOCATION">Location</option>
              <option value="ACHAT">Achat</option>
            </select>
          </div>

          {/* ── Locataire / Acheteur ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locataire / Acheteur <span className="text-red-500">*</span>
            </label>
            <select
              name="locataire_id"
              value={form.locataire_id}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">— Sélectionnez un locataire —</option>
              {locataires.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.user.prenoms} {l.user.nom} ({l.user.email})
                </option>
              ))}
            </select>
          </div>

          {/* ── Type de paiement (uniquement ACHAT) ── */}
          {!isLocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de paiement <span className="text-red-500">*</span>
              </label>
              <select
                name="type_paiement_achat"
                value={form.type_paiement_achat}
                onChange={handleChange}
                required={!isLocation}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="TOTALITE">Totalité (Comptant - 100%)</option>
                <option value="PARTIEL">Partiel (50% puis 5x10%)</option>
              </select>
            </div>
          )}

          {/* ── Dates (uniquement LOCATION) ── */}
          {isLocation && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date_debut"
                  value={form.date_debut}
                  onChange={handleChange}
                  required={isLocation}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date_fin"
                  value={form.date_fin}
                  onChange={handleChange}
                  required={isLocation}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* ── Champs financiers : LOCATION ── */}
          {isLocation && (
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Finances (Location)
              </h2>

              {/* Loyer mensuel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loyer mensuel (Ar) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="loyer"
                  value={form.loyer}
                  onChange={handleChange}
                  required={isLocation}
                  placeholder={
                    chargementBien
                      ? "Chargement…"
                      : bienSelectionne
                      ? ""
                      : "Sélectionnez d'abord un bien"
                  }
                  readOnly={chargementBien}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    chargementBien
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-wait"
                      : "border-gray-300"
                  }`}
                />
                {bienSelectionne?.loyer_mensuel && form.loyer && (
                  <p className="mt-1 text-xs text-emerald-600">
                    ✅ Pré-rempli automatiquement depuis le loyer mensuel du bien
                  </p>
                )}
              </div>

              {/* Dépôt de garantie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dépôt de garantie (Ar) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="depot_garantie"
                  value={form.depot_garantie}
                  onChange={handleChange}
                  required={isLocation}
                  placeholder="Ex : 1 000 000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {bienSelectionne?.loyer_mensuel && form.depot_garantie && (
                  <p className="mt-1 text-xs text-gray-400">
                    Par défaut : 2× le loyer mensuel
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Champs financiers : ACHAT ── */}
          {!isLocation && (
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Finances (Achat)
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix de vente (Ar) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="prix"
                  value={form.prix}
                  onChange={handleChange}
                  required={!isLocation}
                  placeholder={
                    chargementBien ? "Chargement…" : "Ex : 50 000 000"
                  }
                  readOnly={chargementBien}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    chargementBien
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-wait"
                      : "border-gray-300"
                  }`}
                />
                {bienSelectionne?.prix && form.prix && (
                  <p className="mt-1 text-xs text-emerald-600">
                    ✅ Pré-rempli automatiquement depuis le prix du bien
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Boutons ── */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={chargementSoumission || succes}
              className="flex-1 h-10 rounded-lg bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {chargementSoumission ? "Création en cours…" : "Créer le contrat"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="h-10 px-5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
