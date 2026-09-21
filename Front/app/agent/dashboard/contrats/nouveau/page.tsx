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
        <div className="agent-panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <p className="eyebrow">CONTRATS</p>
          <h2 style={{ fontSize: 20, fontWeight: 750, margin: '4px 0' }}>Nouveau contrat</h2>
          <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', margin: 0 }}>
            Remplissez les informations ci-dessous. Les champs financiers sont pré-remplis automatiquement à la sélection du bien.
          </p>
        </div>

        {succes && (
          <div className="agent-info-box green">
            Contrat créé avec succès ! Redirection…
          </div>
        )}

        {erreur && (
          <div className="agent-info-box red" role="alert">
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="agent-form-grid">
            <label className="agent-field full">Bien <span style={{ color: 'var(--red)' }}>*</span>
              <select name="bien_id" value={form.bien_id} onChange={handleBienChange} required>
                <option value="">— Sélectionnez un bien —</option>
                {biens.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.titre} — {b.adresse} ({b.mode_transaction})
                  </option>
                ))}
              </select>
              {chargementBien && <span className="hint">Récupération des informations du bien…</span>}
            </label>
          </div>

          {bienSelectionne && !chargementBien && (
            <div className="agent-info-box blue" style={{ marginTop: 12 }}>
              <strong>{bienSelectionne.titre}</strong>
              <div>{bienSelectionne.adresse} · {bienSelectionne.surface} m²</div>
              {bienSelectionne.loyer_mensuel && (
                <div>Loyer mensuel enregistré : <strong>{formaterMontant(bienSelectionne.loyer_mensuel)} Ar</strong></div>
              )}
              {bienSelectionne.prix && (
                <div>Prix de vente : <strong>{formaterMontant(bienSelectionne.prix)} Ar</strong></div>
              )}
            </div>
          )}

          <div className="agent-form-grid" style={{ marginTop: 14 }}>
            <label className="agent-field">Type de contrat *
              <select name="type_contrat" value={form.type_contrat} onChange={handleChange} required>
                <option value="LOCATION">Location</option>
                <option value="ACHAT">Achat</option>
              </select>
            </label>

            <label className="agent-field">Locataire / Acheteur *
              <select name="locataire_id" value={form.locataire_id} onChange={handleChange} required>
                <option value="">— Sélectionnez un locataire —</option>
                {locataires.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.user.prenoms} {l.user.nom} ({l.user.email})
                  </option>
                ))}
              </select>
            </label>

            {!isLocation && (
              <label className="agent-field">Type de paiement *
                <select name="type_paiement_achat" value={form.type_paiement_achat} onChange={handleChange} required={!isLocation}>
                  <option value="TOTALITE">Totalité (Comptant - 100%)</option>
                  <option value="PARTIEL">Partiel (50% puis 5x10%)</option>
                </select>
              </label>
            )}

            {isLocation && (
              <label className="agent-field">Date de début *
                <input type="date" name="date_debut" value={form.date_debut} onChange={handleChange} required={isLocation} />
              </label>
            )}

            {isLocation && (
              <label className="agent-field">Date de fin *
                <input type="date" name="date_fin" value={form.date_fin} onChange={handleChange} required={isLocation} />
              </label>
            )}

            {isLocation && (
              <label className="agent-field">Loyer mensuel (Ar) *
                <input
                  type="text" name="loyer" value={form.loyer} onChange={handleChange} required={isLocation}
                  placeholder={chargementBien ? "Chargement…" : bienSelectionne ? "" : "Sélectionnez d'abord un bien"}
                  readOnly={chargementBien}
                />
                {bienSelectionne?.loyer_mensuel && form.loyer && (
                  <span className="hint">Pré-rempli automatiquement depuis le bien.</span>
                )}
              </label>
            )}

            {isLocation && (
              <label className="agent-field">Dépôt de garantie (Ar) *
                <input type="text" name="depot_garantie" value={form.depot_garantie} onChange={handleChange} required={isLocation} placeholder="Ex : 1 000 000" />
                {bienSelectionne?.loyer_mensuel && form.depot_garantie && (
                  <span className="hint">Par défaut : 2× le loyer mensuel.</span>
                )}
              </label>
            )}

            {!isLocation && (
              <label className="agent-field">Prix de vente (Ar) *
                <input
                  type="text" name="prix" value={form.prix} onChange={handleChange} required={!isLocation}
                  placeholder={chargementBien ? "Chargement…" : "Ex : 50 000 000"}
                  readOnly={chargementBien}
                />
                {bienSelectionne?.prix && form.prix && (
                  <span className="hint">Pré-rempli automatiquement depuis le bien.</span>
                )}
              </label>
            )}
          </div>

          <div className="agent-modal-actions">
            <button type="button" onClick={() => router.back()} className="agent-btn agent-btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={chargementSoumission || succes} className="agent-btn agent-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {chargementSoumission ? "Création en cours…" : "Créer le contrat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
