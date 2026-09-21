"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getContrats, Contrat } from "@/lib/api"
import { Plus, Search, FileText, Calendar, ChevronRight } from "lucide-react"

export default function AgentContratsPage() {
  const router = useRouter()
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    getContrats()
      .then(setContrats)
      .catch(err => setError(err.message || "Erreur de chargement des contrats"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = contrats.filter((c) => {
    const q = search.toLowerCase()
    return String(c.id).includes(q) || String(c.bien).includes(q) || String(c.locataire).includes(q)
      || (c.bien_titre ?? '').toLowerCase().includes(q)
      || `${c.locataire_prenoms ?? ''} ${c.locataire_nom ?? ''}`.toLowerCase().includes(q)
  })

  return (
    <>
      <div className="agent-head">
        <div>
          <p className="eyebrow">DOCUMENTS</p>
          <h1>Gestion des contrats</h1>
          <p className="subtitle">Consultez, ajoutez et modifiez les baux et contrats de vente.</p>
        </div>
        <div className="agent-head-actions">
          <button className="agent-btn agent-btn-primary" onClick={() => router.push('/agent/contrats/ajouter')}>
            <Plus size={16} /> Nouveau contrat
          </button>
        </div>
      </div>

      <article className="panel">
        <div className="agent-toolbar">
          <div className="agent-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher (bien, locataire, n° contrat)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un contrat"
            />
          </div>
          <span className="agent-badge neutre">{filtered.length} contrat{filtered.length > 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="agent-loading">Chargement des contrats...</div>
        ) : error ? (
          <div className="agent-empty">
            <h2>Chargement impossible</h2>
            <p>{error}</p>
            <button className="agent-btn agent-btn-primary" onClick={() => window.location.reload()}>Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="agent-empty">
            <FileText size={30} />
            <h2>Aucun contrat trouvé</h2>
            <p>Créez votre premier contrat ou ajustez la recherche.</p>
            <button className="agent-btn agent-btn-primary" onClick={() => router.push('/agent/contrats/ajouter')}>
              <Plus size={15} /> Nouveau contrat
            </button>
          </div>
        ) : (
          <div className="agent-list">
            {filtered.map((contrat) => {
              const isLocation = contrat.type_contrat === 'LOCATION'
              return (
                <div className="agent-row clickable" key={contrat.id} onClick={() => router.push(`/agent/contrats/${contrat.id}`)}>
                  <div className={`agent-avatar ${isLocation ? 'blue' : 'gold'}`}>
                    <FileText size={15} />
                  </div>

                  <div className="agent-row-main">
                    <b>{isLocation ? 'Bail de location' : 'Contrat de vente'}</b>
                    <span>Contrat #{contrat.id} • Bien #{contrat.bien} • Locataire #{contrat.locataire}</span>
                  </div>

                  <div className="agent-row-main">
                    <div className="agent-row-meta">
                      <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
                      {contrat.date_debut ? `Du ${new Date(contrat.date_debut).toLocaleDateString('fr-FR')}` : 'Date à définir'}
                    </div>
                    <div className="agent-row-sub">{contrat.bien_titre || contrat.locataire_nom ? `${contrat.bien_titre ?? ''}${contrat.bien_titre && (contrat.locataire_nom || contrat.locataire_prenoms) ? ' • ' : ''}${[contrat.locataire_prenoms, contrat.locataire_nom].filter(Boolean).join(' ')}` : `Créé le ${new Date(contrat.date_creation).toLocaleDateString('fr-FR')}`}</div>
                  </div>

                  <span className={`agent-badge ${isLocation ? 'location' : 'achat'}`}>{isLocation ? 'Location' : 'Achat'}</span>
                  <span className={`agent-badge ${contrat.statut === 'ACTIF' ? 'actif' : 'neutre'}`}>{contrat.statut || 'N/A'}</span>
                  <button className="agent-row-chev" aria-label="Détails du contrat">
                    <ChevronRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </>
  )
}
