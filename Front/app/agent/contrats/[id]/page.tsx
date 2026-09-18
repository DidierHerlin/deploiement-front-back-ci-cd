"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { getContrat, getBienDetail, getLocataireDetail, Contrat, Bien, Locataire } from "@/lib/api"
import { ArrowLeft, Calendar, FileText, Home, User, Edit } from "lucide-react"

export default function ContratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = parseInt(resolvedParams.id, 10)
  
  const [contrat, setContrat] = useState<Contrat | null>(null)
  const [bien, setBien] = useState<Bien | null>(null)
  const [locataire, setLocataire] = useState<Locataire | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getContrat(id)
      .then(async (data) => {
        setContrat(data)
        try {
          const [bienData, locData] = await Promise.all([
            getBienDetail(data.bien),
            getLocataireDetail(data.locataire)
          ])
          setBien(bienData)
          setLocataire(locData)
        } catch (e) {
          console.error("Erreur lors de la récupération des détails liés:", e)
        }
      })
      .catch(err => setError(err.message || "Erreur de chargement du contrat"))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <div className="p-12 text-center text-gray-500">Chargement...</div>
  if (error) return <div className="p-12 text-center text-red-500">{error}</div>
  if (!contrat) return <div className="p-12 text-center">Contrat introuvable</div>

  return (
    <div style={{ padding: '24px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button 
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          <ArrowLeft size={16} /> Retour aux contrats
        </button>
        <button 
          onClick={() => router.push(`/agent/contrats/${id}/modifier`)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          <Edit size={14} /> Modifier
        </button>
      </div>

      <article className="panel">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>
          <div>
            <p className="section-kicker">CONTRAT #{contrat.id}</p>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: '6px 0' }}>{contrat.type_contrat === 'LOCATION' ? 'Bail de location' : 'Contrat de vente'}</h2>
            <span 
              className="count-badge" 
              style={{ 
                backgroundColor: contrat.statut === 'ACTIF' ? 'var(--color-teal-600)' : 'var(--color-slate-400)', 
                color: 'white', 
                fontSize: 12, 
                padding: '4px 20px' 
              }}
            >
              {contrat.statut || 'N/A'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 6 }}>
                <Home size={16} /> Bien concerné
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)' }}>
                {bien ? bien.titre : `Bien #${contrat.bien}`}
              </div>
              {bien && (
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
                  {bien.adresse} (ID: #{bien.id})
                </div>
              )}
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 6 }}>
                <User size={16} /> Locataire
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)' }}>
                {locataire ? `${locataire.user.prenoms} ${locataire.user.nom}` : `Locataire #${contrat.locataire}`}
              </div>
              {locataire && (
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
                  {locataire.user.email} (ID: #{locataire.id})
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 6 }}>
                <Calendar size={16} /> Dates importantes
              </div>
              <div style={{ fontSize: 15, color: 'var(--foreground)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span><b>Créé le :</b> {new Date(contrat.date_creation).toLocaleDateString()}</span>
                <span><b>Début :</b> {new Date(contrat.date_debut).toLocaleDateString()}</span>
                {contrat.type_contrat === 'LOCATION' && (
                  <span><b>Fin :</b> {contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString() : 'Indéterminée'}</span>
                )}
                {contrat.date_paiement && (
                  <span><b>Date de paiement :</b> Le {contrat.date_paiement} du mois</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 6 }}>
                <FileText size={16} /> Données financières
              </div>
              <div style={{ fontSize: 16, color: 'var(--foreground)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contrat.type_contrat === 'LOCATION' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      <span>Loyer mensuel :</span>
                      <strong style={{ fontSize: 18 }}>{contrat.loyer ? `${contrat.loyer} Ar` : 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                      <span>Dépôt de garantie :</span>
                      <strong>{contrat.depot_garantie ? `${contrat.depot_garantie} Ar` : 'N/A'}</strong>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <span>Prix de vente :</span>
                    <strong style={{ fontSize: 18 }}>{contrat.prix ? `${contrat.prix} Ar` : 'N/A'}</strong>
                  </div>
                )}
              </div>
            </div>

            {contrat.document_pdf && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 6 }}>
                  <FileText size={16} /> Document joint
                </div>
                <a 
                  href={contrat.document_pdf} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--secondary)', color: 'var(--secondary-foreground)', borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
                >
                  Télécharger le contrat (PDF)
                </a>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
