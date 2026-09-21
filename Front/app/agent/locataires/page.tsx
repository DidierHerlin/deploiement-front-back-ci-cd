"use client"

import { useState, useEffect } from "react"
import { getLocataires, Locataire } from "@/lib/api"
import { Search, Users, Mail, Phone, ChevronRight } from "lucide-react"

const AVATAR_TONES = ['blue', 'teal', 'coral', 'gold', 'sage']

function initials(loc: Locataire) {
  const p = loc.user.prenoms?.charAt(0) ?? ''
  const n = loc.user.nom?.charAt(0) ?? ''
  return `${p}${n}`.toUpperCase() || 'LC'
}

export default function AgentLocatairesPage() {
  const [locataires, setLocataires] = useState<Locataire[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    const fetchLocataires = async () => {
      try {
        const data = await getLocataires()
        setLocataires(data)
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des locataires")
      } finally {
        setLoading(false)
      }
    }
    fetchLocataires()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const filtered = locataires.filter((locataire) => {
    const fullName = `${locataire.user.prenoms} ${locataire.user.nom}`.toLowerCase()
    const email = locataire.user.email.toLowerCase()
    const q = search.toLowerCase()
    return fullName.includes(q) || email.includes(q)
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedLocataires = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const to = Math.min(currentPage * itemsPerPage, filtered.length)

  return (
    <>
      <div className="agent-head">
        <div>
          <p className="eyebrow">LOCATAIRES</p>
          <h1>Liste des locataires</h1>
          <p className="subtitle">Consultez et gérez les informations de vos locataires.</p>
        </div>
        <div className="agent-head-actions">
          <span className="agent-badge neutre"><Users size={13} /> {filtered.length} locataire{filtered.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      <article className="panel">
        <div className="agent-toolbar">
          <div className="agent-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un locataire"
            />
          </div>
        </div>

        {loading ? (
          <div className="agent-loading">Chargement des locataires...</div>
        ) : error ? (
          <div className="agent-empty">
            <h2>Chargement impossible</h2>
            <p>{error}</p>
            <button className="agent-btn agent-btn-primary" onClick={() => window.location.reload()}>Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="agent-empty">
            <Users size={30} />
            <h2>Aucun locataire trouvé</h2>
            <p>Modifiez votre recherche ou ajoutez un contrat pour rattacher un locataire.</p>
          </div>
        ) : (
          <>
            <div className="agent-list">
              {paginatedLocataires.map((loc, i) => (
                <div className="agent-row" key={loc.id}>
                  <div className={`agent-avatar ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
                    {initials(loc)}
                  </div>

                  <div className="agent-row-main">
                    <b>{loc.user.prenoms} {loc.user.nom}</b>
                    <span>Locataire #{loc.id}</span>
                  </div>

                  <div className="agent-row-main">
                    <div className="agent-row-meta">
                      <Mail size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.user.email}</span>
                    </div>
                    {loc.user.telephone && (
                      <div className="agent-row-sub">
                        <Phone size={12} />
                        {loc.user.telephone}
                      </div>
                    )}
                  </div>

                  <span className={`agent-badge ${loc.user.is_active === false ? 'annulee' : 'valide'}`}>
                    {loc.user.is_active === false ? 'Inactif' : 'Actif'}
                  </span>
                  <button className="agent-row-chev" aria-label={`Détails ${loc.user.nom}`}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="agent-pagination">
                <span className="range">Affichage de {from} à {to} sur {filtered.length} locataires</span>
                <div className="pages">
                  <button
                    className="agent-page-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`agent-page-btn${currentPage === page ? ' active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="agent-page-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </article>
    </>
  )
}
