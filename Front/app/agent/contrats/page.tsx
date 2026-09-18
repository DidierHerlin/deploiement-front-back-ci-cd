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
  })

  return (
    <>
      <section className="welcome" style={{ padding: '28px 20px 24px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div>
            <p className="eyebrow">DOCUMENTS</p>
            <h1>Gestion des contrats</h1>
            <p className="subtitle">Consultez, ajoutez et modifiez les baux et contrats de vente.</p>
          </div>
          <button 
            onClick={() => router.push('/agent/contrats/ajouter')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            <Plus size={16} /> Nouveau contrat
          </button>
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
                  placeholder="Rechercher par ID de bien ou de locataire..."
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
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>Chargement des contrats...</div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--destructive)' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>Aucun contrat trouvé.</div>
          ) : (
            <div className="list">
              {filtered.map((contrat, i) => {
                const tone = contrat.type_contrat === 'LOCATION' ? 'blue' : 'gold';
                return (
                  <div className="list-row" key={contrat.id} onClick={() => router.push(`/agent/contrats/${contrat.id}`)} style={{ cursor: 'pointer' }}>
                    <div className={`person-avatar ${tone}-avatar`}>
                      <FileText size={14} />
                    </div>
                    
                    <div className="row-main">
                      <b>{contrat.type_contrat === 'LOCATION' ? 'Bail de location' : 'Contrat de vente'}</b>
                      <span>ID: #{contrat.id}</span>
                    </div>
                    
                    <div className="row-main" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--foreground)' }}>
                        <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
                        Du {new Date(contrat.date_debut).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                        Bien #{contrat.bien} • Locataire #{contrat.locataire}
                      </div>
                    </div>
                    
                    <button className="row-more" aria-label={`Détails du contrat`}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </>
  )
}
