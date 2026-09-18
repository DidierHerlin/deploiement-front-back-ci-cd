"use client"

import { useState, useEffect } from "react"
import { getLocataires, Locataire } from "@/lib/api"
import { Search, Users, Mail, Phone, ChevronRight } from "lucide-react"

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

  // Reset page when search changes
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

  return (
    <>
      <section className="welcome" style={{ padding: '28px 20px 24px 20px', marginBottom: 24 }}>
        <div>
          <p className="eyebrow">LOCATAIRES</p>
          <h1>Liste des locataires</h1>
          <p className="subtitle">Consultez et gérez les informations de vos locataires.</p>
        </div>
      </section>

      <div style={{ padding: '0 20px', paddingBottom: '40px' }}>
        <article className="panel">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
          <div className="title-with-count" style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  outline: 'none',
                  fontSize: 13
                }}
              />
            </div>
          </div>
          <span className="count-badge blue">{filtered.length}</span>
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>Chargement des locataires...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--destructive)' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>Aucun locataire trouvé.</div>
        ) : (
          <>
            <div className="list">
              {paginatedLocataires.map((loc, i) => {
                const tone = ['blue', 'teal', 'coral', 'gold', 'sage'][i % 5];
                return (
                  <div className="list-row" key={loc.id}>
                    <div className={`person-avatar ${tone}-avatar`}>
                      {loc.user.prenoms?.charAt(0)}{loc.user.nom?.charAt(0)}
                    </div>
                    
                    <div className="row-main">
                      <b>{loc.user.prenoms} {loc.user.nom}</b>
                      <span>ID: #{loc.id}</span>
                    </div>
                    
                    <div className="row-main" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--foreground)' }}>
                        <Mail size={14} style={{ color: 'var(--muted-foreground)' }} />
                        {loc.user.email}
                      </div>
                      {loc.user.telephone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                          <Phone size={12} />
                          {loc.user.telephone}
                        </div>
                      )}
                    </div>
                    
                    <button className="row-more" aria-label={`Détails ${loc.user.nom}`}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                  Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filtered.length)} sur {filtered.length} locataires
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 6,
                      background: 'transparent',
                      color: currentPage === 1 ? 'oklch(0.72 0 0)' : 'oklch(0.45 0 0)',
                      border: 'none',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                    onMouseOver={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.background = 'oklch(0.97 0 0)'
                        e.currentTarget.style.color = 'oklch(0.25 0 0)'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'oklch(0.45 0 0)'
                      }
                    }}
                  >
                    Précédent
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    const isActive = currentPage === page;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 500,
                          borderRadius: 6,
                          background: isActive ? 'oklch(0.96 0.04 175 / 0.3)' : 'transparent',
                          color: isActive ? 'var(--color-teal-600)' : 'oklch(0.45 0 0)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'oklch(0.97 0 0)'
                            e.currentTarget.style.color = 'oklch(0.25 0 0)'
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'oklch(0.45 0 0)'
                          }
                        }}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 6,
                      background: 'transparent',
                      color: currentPage === totalPages ? 'oklch(0.72 0 0)' : 'oklch(0.45 0 0)',
                      border: 'none',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                    onMouseOver={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.background = 'oklch(0.97 0 0)'
                        e.currentTarget.style.color = 'oklch(0.25 0 0)'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'oklch(0.45 0 0)'
                      }
                    }}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </article>
      </div>
    </>
  )
}
